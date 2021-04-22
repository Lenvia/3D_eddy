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
filename3 = '../3dAttr2.nc'


def invert(list1):
    return [row[::-1] for row in list1]


def transpose(list1):
    return [list(row) for row in zip(*list1)]


f2 = nc4.Dataset(filename2,'r', format='NETCDF4')  # 'r' stands for read

circ = f2.variables['circ'][:]

# print(circ)

# isEddy = isEddy.transpose([3, 2, 1, 0])  # 经度 纬度 深度 日期
circ = circ.transpose([3, 2, 1, 0])  # 经度 纬度 深度 日期

xupbound = 350
sur_circ = np.zeros((xupbound, 500))

num = 60
for day in range(num):
    sur_circ += circ[:xupbound, :, 0, day]


sur_circ = sur_circ/num
sur_circ = sur_circ[:, :]

sur_circ = invert(sur_circ)
sur_circ = transpose(sur_circ)

# plt.imshow(sur_circ, vmin=0, vmax=1)
plt.imshow(sur_circ, cmap=plt.get_cmap('seismic'), vmin=-1, vmax=1)
plt.colorbar()
plt.show()