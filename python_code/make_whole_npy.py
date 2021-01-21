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

filename = 'COMBINED_2011013100.nc'  # .nc文件名
f = nc4.Dataset(filename)  # 读取.nc文件，传入f中。此时f包含了该.nc文件的全部信息

all_vars = f.variables.keys()  # 获取所有变量名称
all_vars_info = f.variables.items()  # 获取所有变量信息
all_vars_info = list(all_vars_info)  # 此时每个变量的信息为其中一个列表

# 提取 U V W的数据
# 查看var的信息
varSet = ['U', 'V', 'W']  # UVW
# 声明空的np数组
U = np.array([], dtype=np.float64)
V = np.array([], dtype=np.float64)
W = np.array([], dtype=np.float64)

for day in range(2, 5):
    # 赋值
    for i, var in enumerate(varSet):
        var_info = f.variables[var]  # 获取变量信息
        var_data = f[var][day]  # 获取变量的数据
        print(var_data.shape)
        # var_data = np.array(var_data)  # 转化为np.array数组
        if i == 0:  # U数据
            U = var_data
        elif i == 1:  # V数据
            V = var_data
        elif i == 2:  # W数据
            W = var_data

    # U.shape(50, 500, 500)  层数、纬度、经度
    # vec.shape = (500, 500, 50) 应该是（纬度，经度，层数），因为npy_to_vtk.py自己会调换经纬
    vec = np.zeros(shape=(500, 500, 50, 3))
    # print(vec.shape)

    for i in range(500):
        for j in range(500):
            for k in range(50):
                vec[i][j][k][0] = U[k][i][j]
                vec[i][j][k][1] = V[k][i][j]
                vec[i][j][k][2] = W[k][i][j]

    dict_ = {'x': vec, 'y': 4}  # x表示数据，y表示x的维数

    tarDir = 'whole_npy_file/'
    if not os.path.exists(tarDir):
        os.makedirs(tarDir)

    file = tarDir + 'vec' + str(day) + '.npy'

    np.save(file, dict_)
    print('successfully saved!')
    dict_load = np.load(file, allow_pickle=True)
    dict_load = dict_load.item()
    # print(dict_load)



