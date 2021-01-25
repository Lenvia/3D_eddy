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
import netCDF4 as nc4
import datetime
import joblib
import os
import sys
from sympy import *
from math import radians, cos, sin, asin, sqrt

day = sys.argv[1]
day = int(day)


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

    tarDir = '../plot_file2'
    if not os.path.exists(tarDir):
        os.makedirs(tarDir)

    plt.savefig(os.path.join(tarDir, str(day) + '.png'))
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

    """计算两点间距离（单位：m）"""
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


## Plot velocities and eddies #############################################################
def plot_eddies2(day_julian_hours,lon,lat,OW,k_plot):
    #k_plot: z-level to plot.  Usually set to 0 for the surface.

    fig,axes = plt.subplots(nrows=3, ncols=2,figsize=(10,8))

    pos4 = axes[1,1].imshow(OW[:,:,k_plot].T, extent=[lon[0],lon[-1],lat[0],lat[-1]],aspect='auto',origin="lower",cmap='jet')
    axes[1,1].set_title('Okubo-Weiss')

    fig.colorbar(pos4, ax=axes[1,1])

    origin = datetime.date(1950, 1, 1)
    st =fig.suptitle('Eddy data for the ' + str(julianh2gregorian(day_julian_hours,origin)), fontsize="x-large")
    st.set_y(1.02)

    plt.tight_layout()
    plt.savefig('plot_file2/' + str(day) + '.png')
    plt.show()

    return plt

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
    lon = f.variables['XC']  # 经度
    lat = f.variables['YC']  # 纬度
    depth = f.variables['Z_MIT40'][:]  # 层数

    # Load time in hours from 1950-01-01
    t = f.variables['T_AX'][:]  # 时间数组

    return (f,lon,lat,depth,t)
    f.close()


if __name__ == '__main__':
    k_plot = 0


    tarDir = os.path.join("../result2", "small" + str(day))

    # (f, lon, lat, depth, t) = load_netcdf4('COMBINED_2011013100.nc')

    t = joblib.load(tarDir + '/t.pkl')
    lon = joblib.load(tarDir + '/lon.pkl')
    lat = joblib.load(tarDir + '/lat.pkl')
    uvel = joblib.load(tarDir + '/uvel.pkl')
    vvel = joblib.load(tarDir + '/vvel.pkl')
    vorticity = joblib.load(tarDir + '/vorticity.pkl')
    OW = joblib.load(tarDir + '/OW.pkl')
    OW_eddies = joblib.load(tarDir + '/OW_eddies.pkl')
    eddie_census = joblib.load(tarDir + '/eddie_census.pkl')
    nEddies = joblib.load(tarDir + '/nEddies.pkl')
    circulation_mask = joblib.load(tarDir + '/circulation_mask.pkl')
    levels = joblib.load(tarDir + '/levels.pkl')

    # print("start plot")
    # plt = plot_eddies(t[day], lon, lat, uvel, vvel, vorticity, OW, OW_eddies, eddie_census, nEddies, circulation_mask, k_plot)
    # plt = plot_eddies2(t[day], lon, lat, OW, k_plot)
    # '''
    # characteristics of the detected eddies -->
    # minOW, circ(m^2/s), lon(º), lat(º), cells, diameter(km)
    # '''
    #
    # # print("all lon")
    # # print(lon)
    # # print("all lat")
    # # print(lat)

    size = len(levels)

    # print("lon:")
    # print(eddie_census[2][:size])
    # print("lat:")
    # print(eddie_census[3][:size])
    print("cells:")
    print(eddie_census[4][:size])
    print("diam:")
    print(eddie_census[-1][:size])
    print("levels:")
    print(levels)
    print("circulation_mask:")
    print(circulation_mask.shape)
    # pos = 0
    # neg = 0
    # for i in range(circulation_mask.shape[0]):
    #     for j in range(circulation_mask.shape[1]):
    #         for k in range(circulation_mask.shape[2]):
    #             if circulation_mask[i][j][k] > 0:
    #                 pos += 1
    #             elif circulation_mask[i][j][k] < 2e-10:
    #                 neg += 1
    # print(pos)
    # print(neg)
    #
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
