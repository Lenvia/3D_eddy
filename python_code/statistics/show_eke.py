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
# filename3 = '../3dAttr2.nc'


def invert(list1):
    return [row[::-1] for row in list1]


def transpose(list1):
    return [list(row) for row in zip(*list1)]


f0 = nc4.Dataset(filename0,'r', format='NETCDF4')
# f1 = nc4.Dataset(filename1,'r', format='NETCDF4')  # 'r' stands for read

u = f0.variables['U'][:]
v = f0.variables['V'][:]
# salt = f0.variables['SALT'][:]
# temp = f0.variables['TEMP'][:]

u = u.transpose([3, 2, 1, 0])

v = v.transpose([3, 2, 1, 0])


#
# joblib.dump(u, './u.pkl')
# joblib.dump(v, './v.pkl')

# u = joblib.load('./u.pkl')
# v = joblib.load('./v.pkl')

u = u[:, :, 0, :]
v = v[:, :, 0, :]


xupbound = 350

sur_eke = np.zeros((xupbound, 500))


num = 60
for day in range(num):
    # sur_isEddy += isEddy[:, :, 0, day]  # 表层
    temp = 0.5 * (u[:xupbound, :, day] ** 2 + v[:xupbound, :, day] ** 2)

    sur_eke = np.array((sur_eke, temp))
    sur_eke = sur_eke.max(axis=0)

    # sur_eke += temp


# sur_eke = sur_eke/num
sur_eke = sur_eke[:, :] * 10000  # m2s-2 转 cm2s-2

sur_eke = invert(sur_eke)
sur_eke = transpose(sur_eke)

plt.imshow(sur_eke, vmin=0, vmax=1000, )
# plt.imshow(sur_eke)
plt.colorbar()
plt.show()

    # plt.savefig('./eke/'+str(day)+'.png')  # 保存图片
    #
    # plt.clf()

# plt.close()
