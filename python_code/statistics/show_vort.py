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


f3 = nc4.Dataset(filename3,'r', format='NETCDF4')  # 'r' stands for read

vort = f3.variables['vort'][:]

vort = vort.transpose([3, 2, 1, 0])  # 经度 纬度 深度 日期

vort = abs(vort)


sur_vort = np.zeros((350, 500))

num = 60
for day in range(num):
    sur_vort += vort[:350, :, 0, day]


sur_vort = sur_vort/num
sur_vort = sur_vort[:, :]

sur_vort = invert(sur_vort)
sur_vort = transpose(sur_vort)

plt.imshow(sur_vort)
# plt.imshow(sur_vort)
plt.colorbar()
plt.show()