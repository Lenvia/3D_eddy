"""
Created on Tue Feb 12 15:03:30 2019

@author: jasaa
eddy detection functions

eddy_detection:
    inputs:
        - filename: name of the netCDF file with the data
        - day: day number
        - R2_criterion: Confidence level, usually 90%
        - OW_start: OW value at which to begin the evaluation of R2
        - max_evaluation_points: Number of local minima to evaluate using R2 method.
        Set low (like 20) to see a few R2 eddies quickly.
        Set high (like 1e5) to find all eddies in domain.
        - min_eddie_cells: Minimum number of cells required to be identified as an eddie.

    returns a tuple with:
        - lon: longitude vector (deg)
        - lat: latitude vector (deg)
        - uvel: zonal velocity (m/s)
        - vvel: meridional velocity (m/s)
        - vorticity (m/s)
        - nEddies: number of eddies found
        - eddy_census: characteristics of the detected eddies --> minOW, circ(m^2/s), lon(º), lat(º), cells, diameter(km)
        - OW: non-dimensional Okubo-Weiss parameter
        - OW_eddies: OW<OW_start --> cells that could containt the center of an eddy
        - circulation_mask: map of circulation for cyclonic (circ>0) and anti-cyclonic (circ<0) eddies, circ=0 if the cell is not in an eddy
"""

# uvel: 纬向速度； vvel: 经线速度； vorticity: 涡度

# import all necesary libraries
import matplotlib.pyplot as plt
import math
import numpy as np
import scipy.signal as sg
import pandas as pd
import netCDF4 as nc4
import datetime
import joblib
import os
import sys
from sympy import *
from math import radians, cos, sin, asin, sqrt

day = sys.argv[1]
day = int(day)


# Load netCDF4 data
def load_netcdf4(filename):  # name of the netCDF data file
    f = nc4.Dataset(filename,'r', format='NETCDF4')  # 'r' stands for read
    # lon = f.variables['longitude'][:]
    # lat = f.variables['latitude'][:]
    # depth = f.variables['depth'][:]
    # # Load zonal and meridional velocity, in m/s
    # uvel = f.variables['uo'][:]
    # vvel = f.variables['vo'][:]
    # # Load time in hours from 1950-01-01
    # t = f.variables['time'][:]

    # 根据本数据内容提取
    lon = f.variables['XC'][336:]  # 经度
    lat = f.variables['YC'][:132]  # 纬度
    depth = f.variables['Z_MIT40'][:]  # 层数
    # Load zonal and meridional veslocity, in m/s
    uvel = f.variables['U'][:, :, :132, 336:]  # 纬向速度
    vvel = f.variables['V'][:, :, :132, 336:]  # 经线速度

    print(uvel.shape)
    print(vvel.shape)

    # Load time in hours from 1950-01-01
    t = f.variables['T_AX'][:]  # 时间数组

    return (f,lon,lat,depth,uvel,vvel,t)
    f.close()


# Eddy detection algorithm
def eddy_detection(lon,lat,depth,uvel,vvel,day,R2_criterion,OW_start,max_evaluation_points,min_eddie_cells):
    ########################################################################

    # Initialize variables

    ########################################################################

    # We transpose the data to fit with the algorithm provided, the correct order is uvel(lon,lat,depth) while the original from the netCDF is uvel(time,lat,lon,depth)
    # (50, 500, 500)->(500, 500, 50) 即 (depth, lat, lon) -> (lon, lat, depth)
    uvel = uvel[day,:,:,:].transpose(2, 1, 0)
    vvel = vvel[day,:,:,:].transpose(2, 1, 0)

    # Since they are masked arrays (in the mask, True = NaN value), we can fill the masked values with 0.0 to describe land
    uvel.set_fill_value(0.0)
    vvel.set_fill_value(0.0)

    # Create an ocean mask which has value True at ocean cells.
    ocean_mask = ~uvel.mask
    n_ocean_cells = uvel.count()

    nx, ny, nz = uvel.shape

    # Compute cartesian distances for derivatives, in m
    R = 6378e3

    x = np.zeros((nx, ny))
    y = np.zeros((nx, ny))

    for i in range(0,nx):
        for j in range(0,ny):
            x[i,j] = 2.*math.pi*R*math.cos(lat[j]*math.pi/180.)*lon[i]/360.
            y[i,j] = 2.*math.pi*R*lat[j]/360.

    # Gridcell area
    dx,dy,grid_area = grid_cell_area(x,y)

    # Calculate the thickness of each depth level, we do a mean between the level above and below => dz[i] = (depth[i+1] - depth[i-1]) / 2.0;
    # except for the first depth which is 2*depth[0].
    # If the data has only one depth, we choose dz=1, a value chosen arbitrarily
    # to well work with the volume calculations (in this case we would work formally with areas)
    if nz == 1:
        dz = np.array([1])
    else:
        dz = np.zeros(nz)
        # Thickness of each layer
        dz[0] = 2.0*depth[0]
        for i in range(1,nz-1):
            dz[i] = (depth[i+1] - depth[i-1]) / 2.0
        dz[nz-1] = depth[nz-1] - depth[nz-2]

    ########################################################################

    #  Compute Okubo-Weiss

    ########################################################################
    # 把掩码数组为1对应的数据设为0.0
    uvel = uvel.filled(0.0)
    vvel = vvel.filled(0.0)

    # velocity derivatives
    du_dx, du_dy = deriv1_central_diff_3D(uvel, x, y)
    dv_dx, dv_dy = deriv1_central_diff_3D(vvel, x, y)
    # strain and vorticity
    normal_strain = du_dx - dv_dy  # 剪切变形率
    shear_strain = du_dy + dv_dx  # 正交变形率
    vorticity = dv_dx - du_dy  # 相对涡度

    # Compute OW, straight and then normalized with its standard deviation
    OW_raw = normal_strain ** 2 + shear_strain ** 2 - vorticity ** 2
    OW_mean = OW_raw.sum() / n_ocean_cells
    OW_std = np.sqrt(np.sum((np.multiply(ocean_mask,(OW_raw - OW_mean)) ** 2)) / n_ocean_cells)
    OW = OW_raw / OW_std

    # We create a mask with the possible location of eddies, meaning OW<-0.2
    OW_eddies = np.zeros(OW.shape, dtype=int)
    OW_eddies[np.where(OW < OW_start)] = 1

    # '''
    # 执行到这里直接return，下面的R2算法暂时不运行
    # '''
    # return (lon, lat, uvel, vvel, vorticity, OW, OW_eddies)

    ########################################################################

    #  Find local minimums in Okubo-Weiss field

    ########################################################################
    # Efficiency note: Search for local minima could be merged with R2
    # algorithm below.

    print('\nNote: max_evaluation_points set to ' + repr(max_evaluation_points), '\nTo identify eddies over the full domain, set max_evaluation_points to a high number like 1e4.')

    local_mins = local_peaks(OW, OW_start, max_evaluation_points)
    num_mins = local_mins.shape[1]


    ########################################################################

    #  R2 algorithm

    ########################################################################
    print('Beginning R2 algorithm\n')
    # Set a maximum number of cells to search through, for initializing arrays.
    max_eddy_cells_search = 50000

    # Initialize variables for eddy census
    iEddie = 0
    eddie_census = np.zeros((6, num_mins))
    all_eddies_mask = np.zeros(uvel.shape,dtype=int)
    circulation_mask = np.zeros(uvel.shape)

    print('Evaluating eddy at local OW minimuma.  Number of minimums = %g \n' %num_mins)

    levels = []
    # loop over local OW minima
    for imin in range(0, num_mins):
        # initialize variables for this local minimum in OW
        ie = local_mins[0, imin]
        je = local_mins[1, imin]
        ke = local_mins[2, imin]

        # Efficiency note: Eddie and neigbor masks are logical arrays the
        # size of the full 3D domain.  A more efficient implementation is
        # to create a list that records the indices of all eddy and
        # neighbor cells.
        eddie_mask = np.zeros(uvel.shape,dtype=int)
        neighbor_mask = np.zeros(uvel.shape,dtype=int)

        eddie_mask[ie, je, ke] = 1
        minOW = np.zeros((max_eddy_cells_search, 1))
        volume = np.zeros((max_eddy_cells_search, 1))
        R2 = np.zeros((max_eddy_cells_search, 1))

        minOW[0] = OW[ie, je, ke]
        volume[0] = grid_area[ie, je]* dz[ke]
        start_checking = 0
        max_k = 0
        min_k = nz
        # print('imin=' + repr(imin), 'lon='+repr(lon[ie]), 'lon='+repr(lat[je]), 'lon='+repr(lon[ie]) ,'k='+repr(ke),end=' ')
        print('imin=' + repr(imin), 'lon='+repr(lon[ie]), 'lat='+repr(lat[je]), 'k='+repr(ke), end='\n')

        # Loop to accumulate cells neighboring local min, in order of min OW.
        for ind in range(1, max_eddy_cells_search):
            # Identify six neighbors to the newest cell.
            # Subtract eddy mask so cells already in eddy are not candidates.
            neighbor_mask[np.max((ie - 1, 0)), je, ke] = 1 - eddie_mask[np.max((ie - 1, 0)), je, ke]
            neighbor_mask[np.min((ie + 1, nx-1)), je, ke] = 1 - eddie_mask[np.min((ie + 1, nx-1)), je, ke]
            neighbor_mask[ie, np.max((je - 1, 0)), ke] = 1 - eddie_mask[ie, np.max((je - 1, 0)), ke]
            neighbor_mask[ie, np.min((je + 1, ny-1)), ke] = 1 - eddie_mask[ie, np.min((je + 1, ny-1)), ke]
            neighbor_mask[ie, je, np.max((ke - 1, 0))] = 1 - eddie_mask[ie, je, np.max((ke - 1, 0))]
            neighbor_mask[ie, je, np.min((ke + 1, nz-1))] = 1 - eddie_mask[ie, je, np.min((ke + 1, nz-1))]
            # neighboring the current eddy cells.
            neighbor_indices = np.where(neighbor_mask)
            minOW[ind] = np.min(OW[neighbor_indices])
            minInd = np.where(OW[neighbor_indices] == minOW[ind])[0][0]
            ie,je,ke =np.asarray(neighbor_indices)[:,minInd]

            # (ie,je,ke) is the newest cell added to the eddy.  Reset masks
            # at that location.
            eddie_mask[ie, je, ke] = 1
            neighbor_mask[ie, je, ke] = 0
            min_k = np.min((min_k, ke+1))
            max_k = np.max((max_k, ke+1))

            # We are building a data set of minimum OW versus volume
            # accumulated so far in this search.  If the new eddy cell has
            # lower OW, record the previous value of OW.  This is so OW
            # values are always increasing.
            minOW[ind] = np.max((minOW[ind], minOW[ind - 1]))
            volume[ind] = volume[ind - 1] + grid_area[ie, je]*dz[ke]

            # Reject eddies identified over duplicate cells. Don't check every time for efficiency.
            # Note: This illustrative algorithm uses the first accepted
            # eddy, and all later eddies in identical cells are duplicates.
            # A better method is to find the bounds of all accepted eddies,
            # and then choose among duplicates with another criteria, for
            # example largest volume.
            if np.mod(ind, 20) == 0:
                if np.max(eddie_mask + all_eddies_mask) == 2:
                    print('No, duplicate\n')
                    break
            if start_checking == 0:
            # When OW value greater than OW_start, check if R2 criterion
            # is met.
                if minOW[ind] > OW_start:
                # Compute R2 value of linear fit of volume versus min OW.
                    temp = np.corrcoef(minOW[0:ind+1],volume[0:ind+1],rowvar=False)
                    R2[ind] = temp[0, 1]
                    if R2[ind] < R2_criterion:
                        print('No, R2 criterion not met\n')
                        break
                    else:
                        # After this iteration, check R2 every time.
                        start_checking = 1
            else:
                # Compute R2 value of linear fit of volume versus min OW.
                temp = np.corrcoef(minOW[0:ind+1],volume[0:ind+1],rowvar=False)
                R2[ind] = temp[0, 1]
                # When the R2 value falls below the critical level, we may have an eddie.
                if R2[ind] < R2_criterion:

                    # Reject eddies identified over duplicate cells.
                    if np.max(eddie_mask + all_eddies_mask) == 2:
                        print('No, duplicate eddie\n')
                        break
                    # Reject eddies that are too small.
                    if ind <= min_eddie_cells:
                        print('No, too small.  Number of cells ='+repr(ind),'\n')
                        break

                    iEddie += 1
                    print('Yes, eddie confirmed.  iEddie='+repr(iEddie),'\n')
                    levels.append(ke)

                    # find minimum OW value and location with this eddie
                    eddie_indices = np.where(eddie_mask)
                    minOW_eddie = np.min(OW[eddie_indices])
                    tempInd = np.where(OW[eddie_indices] == minOW_eddie)[0][0]
                    iE, jE, kE = np.asarray(eddie_indices)[:,tempInd]

                    # Find diameter of this eddie, using area at depth of max OW
                    # value, in cm^2.  Diameter is in km.
                    area = np.sum(grid_area[np.where(eddie_mask[:,:, kE])])
                    diameter = 2*np.sqrt(area/np.pi)/1e3

                    # Circulation aroung the eddie
                    # Calculated on a square around the center of the eddy, positive in the clockwise direction

                    circ_sides = -vvel[np.min((iE+1,nx-1)), jE, kE]*dy[np.min((iE+1,nx-1)),jE] - uvel[iE, np.max((jE-1,0)), kE]*dx[iE,np.max((0,jE-1))] + vvel[np.max((0,iE-1)), jE, kE]*dy[np.max((iE-1,0)),jE] + uvel[iE, np.min((jE+1,ny-1)), kE]*dx[iE,np.min((jE+1,ny-1))]
                    circ_corner1 = -vvel[np.min((iE+1,nx-1)), np.max((jE-1,0)), kE]*0.5*dy[np.min((iE+1,nx-1)),np.max((jE-1,0))] - uvel[np.min((iE+1,nx-1)), np.max((jE-1,0)), kE]*0.5*dx[np.min((iE+1,nx-1)),np.max((jE-1,0))]
                    circ_corner2 = -uvel[np.max((0,iE-1)), np.max((jE-1,0)), kE]*0.5*dx[np.max((0,iE-1)),np.max((jE-1,0))] + vvel[np.max((0,iE-1)), np.max((jE-1,0)), kE]*0.5*dy[np.max((0,iE-1)),np.max((jE-1,0))]
                    circ_corner3 =  vvel[np.max((0,iE-1)), np.min((jE+1,ny-1)), kE]*0.5*dy[np.max((0,iE-1)),np.min((jE+1,ny-1))] + uvel[np.max((0,iE-1)), np.min((jE+1,ny-1)), kE]*0.5*dx[np.max((0,iE-1)),np.min((jE+1,ny-1))]
                    circ_corner4 =  uvel[np.min((iE+1,nx-1)), np.min((jE+1,ny-1)), kE]*0.5*dx[np.min((iE+1,nx-1)),np.min((jE+1,ny-1))] - vvel[np.min((iE+1,nx-1)), np.min((jE+1,ny-1)), kE]*0.5*dy[np.min((iE+1,nx-1)),np.min((jE+1,ny-1))]

                    circ = circ_sides + circ_corner1 + circ_corner2 + circ_corner3 + circ_corner4

                    # add this eddy to the full eddy mask
                    all_eddies_mask = all_eddies_mask + eddie_mask

                    # add eddy to the full circulation mask
                    circulation_mask = circulation_mask + circ*eddie_mask

                    # record eddie data
                    eddie_census[:, iEddie-1] = (minOW[0], circ, lon[iE], lat[jE], ind, diameter)

                    break

    nEddies = iEddie

    # return (lon,lat,uvel,vvel,vorticity,OW,OW_eddies,eddie_census,nEddies,circulation_mask)
    return (lon,lat,uvel,vvel,vorticity,OW,OW_eddies,eddie_census,nEddies,circulation_mask, levels)

## Creates grid #####################################################
def grid_cell_area(x,y):
# Given 2D arrays x and y with grid cell locations, compute the
# area of each cell.

    nx,ny = x.shape
    dx = np.zeros((nx,ny))
    dy = np.zeros((nx,ny))

    for j in range(0,ny):
        dx[0,j] = x[1,j] - x[0,j]
        for i in range(1,nx-1):
            dx[i,j] = (x[i+1,j] - x[i-1,j]) / 2.0
        dx[nx-1,j] = x[nx-1,j] - x[nx-2,j]

    for i in range(0,nx):
        dy[i,0] = y[i,1] - y[i,0]
        for j in range(1,ny - 1):
            dy[i,j] = (y[i,j+1] - y[i,j-1]) / 2.0
        dy[i,ny-1] = y[i,ny-1] - y[i,ny-2]

    A = np.multiply(dx,dy)
    return (dx,dy,A)


## Calculate strains, vorticity and Okubo-Weiss ######################################

def deriv1_central_diff_3D(a,x,y):
# Take the first derivative of a with respect to x and y using centered central differences. The variable a is a 3D field.
    nx,ny,nz = a.shape
    dadx = np.zeros((nx,ny,nz))
    dady = np.zeros((nx,ny,nz))

    for k in range(0,nz):
        for j in range(0,ny):
            dadx[0,j,k] = (a[1,j,k] - a[0,j,k]) / (x[1,j] - x[0,j])
            for i in range(1,nx-1):
                dadx[i,j,k] = (a[i+1,j,k] - a[i-1,j,k]) / (x[i+1,j] - x[i-1,j])
            dadx[nx-1,j,k] = (a[nx-1,j,k] - a[nx-2,j,k]) / (x[nx-1,j] - x[nx-2,j])

        for i in range(0,nx):
            dady[i,0,k]=(a[i,1,k] - a[i,0,k]) / (y[i,1] - y[i,0])
            for j in range(1,ny-1):
                dady[i,j,k]=(a[i,j+1,k] - a[i,j-1,k]) / (y[i,j+1] - y[i,j-1])
            dady[i,ny-1,k]=(a[i,ny-1,k] - a[i,ny-2,k]) / (y[i,ny-1] - y[i,ny-2])

    return dadx,dady


## Find local minima ###################################################################

def find_local_mins(A,A_start,max_evaluation_points):
# Find local minimums of the 3D array A that are less than
# A_start.  The output, local_mins, is a 3xm array of the m
# minimums found, containing the three A indices of each minimum.
# The search evaluates every k level, but not the horizontal edges.
    nx,ny, nz = A.shape
    local_mins = np.zeros((3,max_evaluation_points),dtype=int)

    imin = -1
    for k in range(0,nz):
        for j in range(1,ny-1):
            for i in range(1,nx-1):
               # if np.max((0,k-1)) == np.min((nz-1,k+1)):
                   # A_min_neighbors =  np.min(A[i-1:i+1, j-1:j+1,np.max((0,k-1))])
                #else:
                A_min_neighbors =  np.min(A[i-1:i+2, j-1:j+2, np.max((0,k-1)): 1+np.min((nz-1,k+1))])
                if (A[i,j,k] < A_start) and (A[i,j,k] == A_min_neighbors):
                    imin += 1
                    local_mins[:,imin] = (i,j,k)
                    if imin == max_evaluation_points-1:
                        return local_mins

    local_mins = local_mins[:,0:imin]
    return local_mins


def local_minima3D(A,A_start,max_evaluation_points):
# Alternative method of finding minima of the 3D array A that are less than
# A_start.  The output, local_mins, is a 3xm array of the positions of the minima found.
# minimums found, containing the three A indices of each minimum.
# The compares each point with its neighbors and creates a boolean mask with the positions of the minima.
# minima_mask is an boolean array where True == minima in that point.
    mask_minima = ((A<A_start)      &
                   (np.abs(A)>0.0) &
            (A <= np.roll(A,  1, axis = 0)) &
            (A <= np.roll(A, -1, axis = 0)) &
            (A <= np.roll(A,  1, axis = 1)) &
            (A <= np.roll(A, -1, axis = 1)) &
            (A <= np.roll(A,  1, axis = 2)) &
            (A <= np.roll(A, -1, axis = 2)))

    n_minima = np.count_nonzero(mask_minima)
    local_min = np.asarray(np.where(mask_minima))
    sample = np.random.randint(0,local_min.shape[1],size = np.min((max_evaluation_points,n_minima)))

    return mask_minima,local_min[:,sample]

def local_peaks(A,A_start,max_evaluation_points):
# Using the scipy.signal.fing_peaks function with flattened array and unravelling it, probably much faster.
    A_flat = A.flatten()
    peaks = sg.find_peaks(-A_flat,height=-A_start)
    print(peaks)
    n_minima = len(peaks[0])
    print(n_minima)
    local_min = np.asarray(np.unravel_index(peaks[0],A.shape))
    print(local_min)
    print(local_min.shape)
    print(local_min.shape[1])
    sample = np.random.randint(0,local_min.shape[1],size = np.min((max_evaluation_points,n_minima)))
    print(sample)

    return local_min[:,sample]


## Print the eddy census ##################################################################
def dataframe_eddies(eddie_census,nEddies):
    #prints the characteristics of the eddies from eddie_census

    name_list = ['minOW','circ(m^2/s)','lon(º)','lat(º)','cells','diameter(km)']
    data = eddie_census[:,0:nEddies].T

    df = pd.DataFrame(data,index= np.arange(1,nEddies+1),columns=name_list)
    return df

## Plot velocities and eddies #############################################################

def plot_eddies(day_julian_hours,lon,lat,uvel,vvel,vorticity,OW,OW_eddies,eddie_census,nEddies,intensity_mask,k_plot):
    #k_plot: z-level to plot.  Usually set to 0 for the surface.

    fig,axes = plt.subplots(nrows=3, ncols=2,figsize=(10,10))

    pos1 = axes[0,0].imshow(uvel[:,:,k_plot].T, extent=[lon[0],lon[-1],lat[0],lat[-1]],aspect='auto',origin="lower",cmap='jet')
    axes[0,0].set_title(r'Zonal velocity $(m/s) \rightarrow$')

    pos2 =axes[0,1].imshow(vvel[:,:,k_plot].T, extent=[lon[0],lon[-1],lat[0],lat[-1]],aspect='auto',origin="lower",cmap='jet')
    axes[0,1].set_title(r'Meridional velocity $(m/s) \uparrow$')

    pos3 = axes[1,0].imshow(1e5*vorticity[:,:,k_plot].T, extent=[lon[0],lon[-1],lat[0],lat[-1]],aspect='auto',origin="lower",cmap='jet')
    axes[1,0].set_title('Vorticity ($10^5/s$)')

    pos4 = axes[1,1].imshow(OW[:,:,k_plot].T, extent=[lon[0],lon[-1],lat[0],lat[-1]],aspect='auto',origin="lower",cmap='jet')
    axes[1,1].set_title('Okubo-Weiss')

    pos5 = axes[2,0].imshow(OW_eddies[:,:,k_plot].T, extent=[lon[0],lon[-1],lat[0],lat[-1]], aspect='auto',origin="lower")
    axes[2,0].set_title('Possible eddies ($OW<OW_{start}$)')

    pos6 = axes[2,1].imshow(intensity_mask[:,:,k_plot].T, extent=[lon[0],lon[-1],lat[0],lat[-1]],aspect='auto',origin="lower",cmap='jet')
    axes[2,1].set_title('Circulation ($m^2/s$), $>0$: cyclonic, $<0$: anticyclonic, $=0$: no eddy')
    for i in range(0,nEddies):
        text = axes[2,1].annotate(i+1, eddie_census[2:4,i])
        text.set_fontsize('x-small')
        text.set_color('k')

    # add the colorbar using the figure's method,telling it which mappable we're talking about and which axes object it should be near
    fig.colorbar(pos1, ax=axes[0,0])
    fig.colorbar(pos2, ax=axes[0,1])
    fig.colorbar(pos3, ax=axes[1,0])
    fig.colorbar(pos4, ax=axes[1,1])
    fig.colorbar(pos5, ax=axes[2,0])
    fig.colorbar(pos6, ax=axes[2,1])

    origin = datetime.date(1950, 1, 1)
    st =fig.suptitle('Eddy data for the ' + str(julianh2gregorian(day_julian_hours,origin)), fontsize="x-large")
    st.set_y(1.02)

    plt.tight_layout()
    plt.show()
    return plt


## Change date format #############################################################
def julianh2gregorian(time_hours,origin):
    return origin + datetime.timedelta(hours=time_hours)


# 计算位置
class Get_new_gps():
    def __init__(self):
        # 地球半径
        self.R = 6371 * 1000
        pass

    """计算两点间距离"""
    def geodistance(self, lon1, lat1, lon2, lat2):
        lon1, lat1, lon2, lat2 = map(radians, [float(lon1), float(lat1), float(lon2), float(lat2)])  # 经纬度转换成弧度
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
        distance = 2 * asin(sqrt(a)) * self.R  # 地球平均半径，6371km
        distance = round(distance, 3)
        return distance

    """计算点经纬度 北dist米的点的经纬度"""
    def get_nor(self, lonC, latC, dist):
        latNorth = 180 * dist / (self.R * pi) + latC
        return (lonC, latNorth)

    """计算点经纬度 南dist米的点的经纬度"""
    def get_sou(self, lonC, latC, dist):
        latSouth = - 180 * dist / (self.R * pi) + latC
        return (lonC, latSouth)

    """计算点经纬度 东dist米点的经纬度"""
    def get_east(self, lonC, latC, dist):
        lonEast = 180 * dist / (self.R * pi * cos(radians(latC))) + lonC
        return (lonEast, latC)

    """计算点经纬度 西dist米点的经纬度"""
    def get_west(self, lonC, latC, dist):
        lonWest = - 180 * dist / (self.R * pi * cos(radians(latC))) + lonC
        return (lonWest, latC)

    """计算点东北方向与正东某夹角某距离的经纬度"""
    def get_east_lon_angle(self, lonC, latC, dist=500, angle=30):
        latNorth = 180 * dist*sin(radians(angle)) / (self.R * pi) + latC
        lonNorth = 180 * dist*cos(radians(angle)) / (self.R * pi * cos(radians(latC))) + lonC
        return (lonNorth, latNorth)


if __name__ == '__main__':
    (f, lon, lat, depth, uvel, vvel, t) = load_netcdf4('../COMBINED_2011013100.nc')
    # capture
    R2_criterion = 0.9
    OW_start = -0.2
    max_evaluation_points = 200
    min_eddie_cells = 3

    k_plot = 0

    lon, lat, uvel, vvel, vorticity, OW, OW_eddies, eddie_census, nEddies, circulation_mask, levels \
        = eddy_detection(lon, lat, depth, uvel, vvel, day, R2_criterion, OW_start, max_evaluation_points, min_eddie_cells)

    print("successfully detected!")

    tarDir = os.path.join("../result", "small" + str(day))

    if not os.path.exists(tarDir):
        os.makedirs(tarDir)

    joblib.dump(t, tarDir + '/t.pkl')
    joblib.dump(lon, tarDir + '/lon.pkl')
    joblib.dump(lat, tarDir + '/lat.pkl')
    joblib.dump(uvel, tarDir + '/uvel.pkl')
    joblib.dump(vvel, tarDir + '/vvel.pkl')
    joblib.dump(vorticity, tarDir + '/vorticity.pkl')
    joblib.dump(OW, tarDir + '/OW.pkl')
    joblib.dump(OW_eddies, tarDir + '/OW_eddies.pkl')
    joblib.dump(eddie_census, tarDir + '/eddie_census.pkl')
    joblib.dump(nEddies, tarDir + '/nEddies.pkl')
    joblib.dump(circulation_mask, tarDir + '/circulation_mask.pkl')
    joblib.dump(levels, tarDir + '/levels.pkl')

    # t = joblib.load(tarDir + '/t.pkl')
    # lon = joblib.load(tarDir + '/lon.pkl')
    # lat = joblib.load(tarDir + '/lat.pkl')
    # uvel = joblib.load(tarDir + '/uvel.pkl')
    # vvel = joblib.load(tarDir + '/vvel.pkl')
    # vorticity = joblib.load(tarDir + '/vorticity.pkl')
    # OW = joblib.load(tarDir + '/OW.pkl')
    # OW_eddies = joblib.load(tarDir + '/OW_eddies.pkl')
    # eddie_census = joblib.load(tarDir + '/eddie_census.pkl')
    # nEddies = joblib.load(tarDir + '/nEddies.pkl')
    # circulation_mask = joblib.load(tarDir + '/circulation_mask.pkl')
    # levels = joblib.load(tarDir + '/levels.pkl')
    #
    # print("start plot")
    # plt = plot_eddies(t[day], lon, lat, uvel, vvel, vorticity, OW, OW_eddies, eddie_census, nEddies, circulation_mask, k_plot)
    #
    # '''
    # characteristics of the detected eddies -->
    # minOW, circ(m^2/s), lon(º), lat(º), cells, diameter(km)
    # '''
    #
    # # print("all lon")
    # # print(lon)
    # # print("all lat")
    # # print(lat)
    #
    # print("lon:")
    # print(eddie_census[2])
    # print("lat:")
    # print(eddie_census[3])
    # print("cells:")
    # print(eddie_census[4])
    # print("diam:")
    # print(eddie_census[-1])
    # print("levels:")
    # print(levels)
    #
    # functions = Get_new_gps()
    # index = 0
    # lonC, latC = [eddie_census[2][index], eddie_census[3][index]]
    # r = eddie_census[-1][index]/2 * 1e3  # 半径
    # level = levels[index]  # 层数
    #
    # # 计算正南的点
    # lonSouth, latSouth = functions.get_sou(lonC, latC, r)
    # # 计算正西的点
    # lonWest, latWest = functions.get_west(lonC, latC, r)
    # # 计算正北的点
    # lonNorth, latNorth = functions.get_nor(lonC, latC, r)
    # # 计算正东的点
    # lonEast, latEast = functions.get_east(lonC, latC, r)
    #
    # print("原始点的经纬度坐标", lonC, latC)
    # print("正南%f米坐标点为%f,%f" % (r, lonSouth, latSouth))
    # print("正西%f米坐标点为%f,%f" % (r, lonWest, latWest))
    # print("正北%f米坐标点为%f,%f" % (r, lonNorth, latNorth))
    # print("正东%f米坐标点为%f,%f" % (r, lonEast, latEast))
    #
    # # 初始化
    # lon_index1 = lon_index2 = -1
    # lat_index1 = lat_index2 = -1
    #
    # # 找出矩形边界四个角的下标
    # for i in range(len(lon)):
    #     if lon[i] > lonWest:
    #         lon_index1 = i-1
    #         break
    # for i in range(len(lon)):
    #     if lon[i] >= lonEast:
    #         lon_index2 = i
    #         break
    #
    # for i in range(len(lat)):
    #     if lat[i] > latSouth:
    #         lat_index1 = i-1
    #         break
    #
    # for i in range(len(lat)):
    #     if lat[i] >= latNorth:
    #         lat_index2 = i
    #         break
    #
    # # 因为本局部范围经度是从336下标开始的
    # lon_index1 += 336
    # lon_index2 += 336
    #
    # lon_index1 -= 2
    # lon_index2 += 2
    # lat_index1 -= 2
    # lat_index2 += 2
    #
    # len1 = lon_index2 - lon_index1 + 1
    # len2 = lat_index2 - lat_index1 + 1
    #
    # print(lon_index1, lon_index2)
    # print(lat_index1, lat_index2)
    #
    # '''
    # 输出UVW的向量
    # '''
    #
    # filename = 'COMBINED_2011013100.nc'  # .nc文件名
    # f = nc4.Dataset(filename)  # 读取.nc文件，传入f中。此时f包含了该.nc文件的全部信息
    #
    # all_vars = f.variables.keys()  # 获取所有变量名称
    # all_vars_info = f.variables.items()  # 获取所有变量信息
    # all_vars_info = list(all_vars_info)  # 此时每个变量的信息为其中一个列表
    #
    # # 提取 U V W的数据
    # # 查看var的信息
    # varSet = ['U', 'V', 'W']  # UVW
    # # 声明空的np数组
    # U = np.array([], dtype=np.float64)
    # V = np.array([], dtype=np.float64)
    # W = np.array([], dtype=np.float64)
    #
    # # 赋值
    # for i, var in enumerate(varSet):
    #     var_info = f.variables[var]  # 获取变量信息
    #     var_data = f[var][day][0:level+1, lat_index1:lat_index2+1, lon_index1:lon_index2+1]  # 获取变量的数据
    #     print(var_data.shape)
    #     # var_data = np.array(var_data)  # 转化为np.array数组
    #     if i == 0:
    #         U = var_data
    #     elif i == 1:
    #         V = var_data
    #     elif i == 2:
    #         W = var_data
    #
    # tarDir = 'result/small' + str(day)
    # if not os.path.exists(tarDir):
    #     os.makedirs(tarDir)
    #
    # joblib.dump(U, tarDir + '/Udata.pkl')
    # joblib.dump(V, tarDir + '/Vdata.pkl')
    # joblib.dump(W, tarDir + '/Wdata.pkl')
    #
    # U = joblib.load(tarDir + '/Udata.pkl')
    # V = joblib.load(tarDir + '/Vdata.pkl')
    # W = joblib.load(tarDir + '/Wdata.pkl')
    #
    #
    # vec = np.zeros(shape=(len2, len1, level, 3))
    # print(vec.shape)
    #
    # for i in range(len2):
    #     for j in range(len1):
    #         for k in range(level):
    #             vec[i][j][k][0] = U[k][i][j]
    #             vec[i][j][k][1] = V[k][i][j]
    #             vec[i][j][k][2] = W[k][i][j]
    #
    # dict_ = {'x': vec, 'y': 4}  # x表示数据，y表示x的维数
    #
    # tarDir = 'npy_file/'
    # file = tarDir + 'vec' + str(day)+ '.npy'
    #
    # if not os.path.exists(tarDir):
    #     os.makedirs(tarDir)
    #
    # np.save(file, dict_)
    # print('successfully saved!')
    # dict_load = np.load(file, allow_pickle=True)
    # dict_load = dict_load.item()
    # print(dict_load)
    #

