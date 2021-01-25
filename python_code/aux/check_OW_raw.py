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
num = sys.argv[2]
day = int(day)
num = int(num)


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

    return OW_raw, OW_eddies



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


if __name__ == '__main__':
    (f, lon, lat, depth, uvel, vvel, t) = load_netcdf4('../COMBINED_2011013100.nc')
    # capture
    R2_criterion = 0.9
    OW_start = -0.2
    max_evaluation_points = 200
    min_eddie_cells = 3

    k_plot = 0

    OW_raw, OW_eddies = eddy_detection(lon, lat, depth, uvel, vvel, day, R2_criterion, OW_start, max_evaluation_points, min_eddie_cells)

    print(OW_raw.shape)

    pos_raw = 0
    neg_raw = 0
    for i in range(OW_raw.shape[0]):
        for j in range(OW_raw.shape[1]):
            for k in range(OW_raw.shape[2]):
                if OW_raw[i][j][k] > 0:
                    pos_raw += 1
                elif OW_raw[i][j][k] < 2e-10:
                    neg_raw += 1
    print(pos_raw)
    print(neg_raw)

    num = 0
    for i in range(OW_eddies.shape[0]):
        for j in range(OW_eddies.shape[1]):
            for k in range(OW_eddies.shape[2]):
                if OW_eddies[i][j][k] == 1:
                    num += 1
    print(num)

