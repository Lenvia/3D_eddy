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


if __name__ == '__main__':
    k_plot = 0


    tarDir = os.path.join("result", "small"+str(day))

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

    '''
    characteristics of the detected eddies -->
    minOW, circ(m^2/s), lon(º), lat(º), cells, diameter(km)
    '''

    # print("all lon")
    # print(lon)
    # print("all lat")
    # print(lat)

    size = len(levels)

    print("lon:")
    print(eddie_census[2][:size])
    print("lat:")
    print(eddie_census[3][:size])
    print("cells:")
    print(eddie_census[4][:size])
    print("diam:")
    print(eddie_census[-1][:size])
    print("levels:")
    print(levels)

    cells = eddie_census[4][:size]
    #
    # for index in range(size):
    #     if cells[index] > 1e2:
    #         functions = Get_new_gps()
    #         lonC, latC = [eddie_census[2][index], eddie_census[3][index]]
    #         r = eddie_census[-1][index]/2 * 1e3  # 半径
    #         level = levels[index]  # 层数
    #
    #         # 计算正南的点
    #         lonSouth, latSouth = functions.get_sou(lonC, latC, r)
    #         # 计算正西的点
    #         lonWest, latWest = functions.get_west(lonC, latC, r)
    #         # 计算正北的点
    #         lonNorth, latNorth = functions.get_nor(lonC, latC, r)
    #         # 计算正东的点
    #         lonEast, latEast = functions.get_east(lonC, latC, r)
    #
    #         print("原始点的经纬度坐标", lonC, latC)
    #         print("正南%f米坐标点为%f,%f" % (r, lonSouth, latSouth))
    #         print("正西%f米坐标点为%f,%f" % (r, lonWest, latWest))
    #         print("正北%f米坐标点为%f,%f" % (r, lonNorth, latNorth))
    #         print("正东%f米坐标点为%f,%f" % (r, lonEast, latEast))
    #
    #         # 初始化
    #         lon_index1 = 0
    #         lon_index2 = len(lon)-1
    #         lat_index1 = 0
    #         lat_index2 = len(lat)-1
    #
    #         # 找出矩形边界四个角的下标
    #         for i in range(len(lon)):
    #             if lon[i] > lonWest:
    #                 lon_index1 = i-1
    #                 break
    #         for i in range(len(lon)):
    #             if lon[i] >= lonEast:
    #                 lon_index2 = i
    #                 break
    #
    #         for i in range(len(lat)):
    #             if lat[i] > latSouth:
    #                 lat_index1 = i-1
    #                 break
    #
    #         for i in range(len(lat)):
    #             if lat[i] >= latNorth:
    #                 lat_index2 = i
    #                 break
    #
    #         # 因为本局部范围经度是从336下标开始的
    #         lon_index1 += 336
    #         lon_index2 += 336
    #
    #         lon_index1 = max(0, lon_index1 - 2)
    #         lon_index2 = min(499, lon_index2 + 2)
    #
    #         lat_index1 = max(0, lat_index1 - 2)
    #         lat_index2 = min(499, lat_index2 + 2)
    #
    #         len1 = lon_index2 - lon_index1 + 1
    #         len2 = lat_index2 - lat_index1 + 1
    #
    #         print(lon_index1, lon_index2)
    #         print(lat_index1, lat_index2)
    #
    #         '''
    #         输出UVW的向量
    #         '''
    #
    #         filename = 'COMBINED_2011013100.nc'  # .nc文件名
    #         f = nc4.Dataset(filename)  # 读取.nc文件，传入f中。此时f包含了该.nc文件的全部信息
    #
    #         all_vars = f.variables.keys()  # 获取所有变量名称
    #         all_vars_info = f.variables.items()  # 获取所有变量信息
    #         all_vars_info = list(all_vars_info)  # 此时每个变量的信息为其中一个列表
    #
    #         # 提取 U V W的数据
    #         # 查看var的信息
    #         varSet = ['U', 'V', 'W']  # UVW
    #         # 声明空的np数组
    #         U = np.array([], dtype=np.float64)
    #         V = np.array([], dtype=np.float64)
    #         W = np.array([], dtype=np.float64)
    #
    #         # 赋值
    #         for i, var in enumerate(varSet):
    #             var_info = f.variables[var]  # 获取变量信息
    #             var_data = f[var][day]  # 获取变量的数据
    #             print(var_data.shape)
    #             # var_data = np.array(var_data)  # 转化为np.array数组
    #             if i == 0:  # U数据
    #                 U = var_data
    #             elif i == 1:  # V数据
    #                 V = var_data
    #             elif i == 2:  # W数据
    #                 W = var_data
    #
    #         tarDir = os.path.join("result", "small"+str(day))
    #         if not os.path.exists(tarDir):
    #             os.makedirs(tarDir)
    #
    #         joblib.dump(U, tarDir + '/Udata.pkl')
    #         joblib.dump(V, tarDir + '/Vdata.pkl')
    #         joblib.dump(W, tarDir + '/Wdata.pkl')
    #
    #         # U = joblib.load(tarDir + '/Udata.pkl')
    #         # V = joblib.load(tarDir + '/Vdata.pkl')
    #         # W = joblib.load(tarDir + '/Wdata.pkl')
    #
    #         # [0:level+1, lat_index1:lat_index2+1, lon_index1:lon_index2+1]
    #
    #         # U.shape(50, 500, 500)  层数、纬度、经度
    #         # vec.shape = (500, 500, 50) 应该是（纬度，经度，层数），因为npy_to_vtk.py自己会调换经纬
    #         vec = np.zeros(shape=(500, 500, 50, 3))
    #         # print(vec.shape)
    #
    #         print(len1, len2, level)
    #         for i in range(lat_index1, lat_index2+1):
    #             for j in range(lon_index1, lon_index2+1):
    #                 for k in range(level):
    #                     vec[i][j][k][0] = U[k][i][j]
    #                     vec[i][j][k][1] = V[k][i][j]
    #                     vec[i][j][k][2] = W[k][i][j]
    #                     # print(i, j, k, vec[i][j][k])
    #
    #         print("lon: ", lon[lon_index1-336], "~", lon[lon_index2-336])
    #         print("lat: ", lat[lat_index1], "~", lat[lat_index2])
    #
    #         dict_ = {'x': vec, 'y': 4}  # x表示数据，y表示x的维数
    #
    #         tarDir = 'npy_file/'
    #
    #         file = os.path.join(tarDir, 'vec'+str(day)+'_'+str(index)+'.npy')  # vec2_0_1.npy 表示day2第0次运行第1个涡旋
    #
    #         if not os.path.exists(tarDir):
    #             os.makedirs(tarDir)
    #
    #         np.save(file, dict_)
    #         print('successfully saved!')
    #         dict_load = np.load(file, allow_pickle=True)
    #         dict_load = dict_load.item()
    #         # print(dict_load)
    #
    #
    #
