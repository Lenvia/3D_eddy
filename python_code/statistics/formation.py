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


# f0 = nc4.Dataset(filename0,'r', format='NETCDF4')
# f1 = nc4.Dataset(filename1,'r', format='NETCDF4')  # 'r' stands for read
f2 = nc4.Dataset(filename2,'r', format='NETCDF4')  # 'r' stands for read
f3 = nc4.Dataset(filename3,'r', format='NETCDF4')  # 'r' stands for read


# u = f0.variables['U'][:]
# v = f0.variables['V'][:]
# salt = f0.variables['SALT'][:]
# temp = f0.variables['TEMP'][:]

# isEddy = f1.variables['isEddy'][:]  # 所有天
circ = f2.variables['circ'][:]
vort = f3.variables['vort'][:]


# u = u.transpose([3, 2, 1, 0])
# u = u[:, :, 0, :]
# v = v.transpose([3, 2, 1, 0])
# v = v[:, :, 0, :]


# salt = salt.transpose([3, 2, 1, 0])
# salt = salt[:, :, 0, :]
# temp = temp.transpose([3, 2, 1, 0])
# temp = temp[:, :, 0, :]

#
# joblib.dump(u, './u.pkl')
# joblib.dump(v, './v.pkl')
# joblib.dump(salt, './salt.pkl')
# joblib.dump(temp, './temp.pkl')
joblib.dump(vort, './vort.pkl')

u = joblib.load('./u.pkl')
v = joblib.load('./v.pkl')
salt = joblib.load('./salt.pkl')
temp = joblib.load('./temp.pkl')
vort = joblib.load('./vort.pkl')

# isEddy = isEddy.transpose([3, 2, 1, 0])  # 经度 纬度 深度 日期
circ = circ.transpose([3, 2, 1, 0])  # 经度 纬度 深度 日期
vort = vort.transpose([3, 2, 1, 0])  # 经度 纬度 深度 日期


sur_isEddy = np.zeros((500, 500))
sur_eke = np.zeros((500, 500))
sur_circ = np.zeros((500, 500))
sur_salt = np.zeros((500, 500))
sur_temp = np.zeros((500, 500))
sur_vort = np.zeros((500, 500))

num = 10
for day in range(num):
    # sur_isEddy += isEddy[:, :, 0, day]  # 表层
    sur_eke = 0.5 * (u[:, :, day] ** 2 + v[:, :, day] ** 2)

    # sur_circ += np.where(circ[:, :, 0, day] <0, 1, 0)
    sur_circ += circ[:, :, 0, day]

    sur_vort += vort[:, :, 0, day]

    # sur_salt += salt[:, :, day]
    # sur_temp += temp[:, :, day]

    # cur_salt = salt[:, :, day]
    #
    # cur_salt = invert(cur_salt)
    # cur_salt = transpose(cur_salt)
    #
    # plt.imshow(cur_salt, cmap=plt.get_cmap('Reds'), vmin=32)
    # plt.colorbar()
    #
    # plt.savefig('./salt/'+str(day)+'.jpg')
    #
    # plt.clf()
    #
    # # plt.show()
    # if day == 59:
    #     plt.close()


# sur_isEddy = sur_isEddy/60
# sur_isEddy = sur_isEddy[:349, :]
# sur_isEddy = invert(sur_isEddy)
# sur_isEddy = transpose(sur_isEddy)
# plt.imshow(sur_isEddy)
# plt.colorbar()
# plt.show()

# sur_eke = sur_eke/num
# sur_eke = sur_eke[:, :] * 10000  # m2s-2 转 cm2s-2
#
# sur_eke = invert(sur_eke)
# sur_eke = transpose(sur_eke)
#
# # plt.imshow(sur_eke, vmin=0, vmax=10, )
# plt.imshow(sur_eke)
# plt.colorbar()
# plt.show()

# sur_circ = sur_circ/num
# sur_circ = sur_circ[:, :]
#
# sur_circ = invert(sur_circ)
# sur_circ = transpose(sur_circ)
#
# # plt.imshow(sur_circ, vmin=0, vmax=1)
# plt.imshow(sur_circ, cmap=plt.get_cmap('seismic'), vmin=-1, vmax=1)
# plt.colorbar()
# plt.show()

sur_vort = sur_vort/num
sur_vort = sur_vort[:, :]

sur_vort = invert(sur_vort)
sur_vort = transpose(sur_vort)

# plt.imshow(sur_vort, vmin=0, vmax=1)
plt.imshow(sur_vort, cmap=plt.get_cmap('seismic'))
plt.colorbar()
plt.show()




# sur_salt = sur_salt/num
# sur_salt = sur_salt[:, :]
#
# sur_salt = invert(sur_salt)
# sur_salt = transpose(sur_salt)
#
# sur_temp = sur_temp/num
# sur_temp = sur_temp[:, :]
#
# sur_temp = invert(sur_temp)
# sur_temp = transpose(sur_temp)
#
# plt.subplot(121)
# # plt.imshow(sur_salt)
# plt.imshow(sur_salt, cmap=plt.get_cmap('plasma'), vmin=30)
# plt.colorbar()
#
# plt.subplot(122)
# # plt.imshow(sur_temp)
# plt.imshow(sur_temp, cmap=plt.get_cmap('plasma'), vmin=20)
# plt.colorbar()
#
# plt.show()