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

filename0 = '../COMBINED_2011013100.nc'
filename1 = '../ensemble1Eddies.nc'
filename2 = '../3dAttr1.nc'


def invert(list1):
    return [row[::-1] for row in list1]

def transpose(list1):
    return [list(row) for row in zip(*list1)]


# f0 = nc4.Dataset(filename0,'r', format='NETCDF4')
f1 = nc4.Dataset(filename1,'r', format='NETCDF4')  # 'r' stands for read
f2 = nc4.Dataset(filename2,'r', format='NETCDF4')  # 'r' stands for read


# u = f0.variables['U'][:]
# v = f0.variables['V'][:]

isEddy = f1.variables['isEddy'][:]  # 所有天
# eke = f2.variables['eke'][:]


# u = u.transpose([3, 2, 1, 0])
# v = v.transpose([3, 2, 1, 0])
# u = u[:, :, 0, :]
# v = v[:, :, 0, :]
#
# joblib.dump(u, './u.pkl')
# joblib.dump(v, './v.pkl')

u = joblib.load('./u.pkl')
v = joblib.load('./v.pkl')

isEddy = isEddy.transpose([3, 2, 1, 0])  # 经度 纬度 深度 日期
# eke = eke.transpose([3, 2, 1, 0])  # 经度 纬度 深度 日期


sur_isEddy = np.zeros((500, 500))
sur_eke = np.zeros((500, 500))

for day in range(20):
    sur_isEddy += isEddy[:, :, 0, day]  # 表层
    # sur_eke += eke[:, :, 0, day]
    sur_eke = 0.5 * (u[:, :, day] ** 2 + v[:, :, day] ** 2)

    # sur_isEddy = sur_isEddy/60
    # sur_isEddy = sur_isEddy[:349, :]
    # sur_isEddy = invert(sur_isEddy)
    # sur_isEddy = transpose(sur_isEddy)
    # plt.imshow(sur_isEddy)
    # plt.colorbar()
    # plt.show()

sur_eke = sur_eke/20
sur_eke = sur_eke[:349, :]

sur_eke = invert(sur_eke)
sur_eke = transpose(sur_eke)


# plt.imshow(sur_eke, vmin=0, vmax=0.15)
plt.imshow(sur_eke)
plt.colorbar()
plt.show()