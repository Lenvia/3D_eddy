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

# 提取 temp salt W的数据
# 查看var的信息
varSet = ['TEMP', 'SALT']  # 温度，盐度
# 声明空的np数组
temp = np.array([], dtype=np.float64)
salt = np.array([], dtype=np.float64)


for day in range(2):
    # 赋值
    for i, var in enumerate(varSet):
        var_info = f.variables[var]  # 获取变量信息
        var_data = f[var][day]  # 获取变量的数据
        # print(var_data.shape)
        # var_data = np.array(var_data)  # 转化为np.array数组
        if i == 0:  # U数据
            temp = var_data
        elif i == 1:  # V数据
            salt = var_data

    # temp.shape(50, 500, 500)  层数、纬度、经度
    temp = temp.transpose((2, 1, 0))
    salt = salt.transpose((2, 1, 0))
    print(temp.shape)

    tarDir1 = os.path.join("whole_attributes_file", 'TEMP')
    tarDir2 = os.path.join("whole_attributes_file", 'SALT')

    if not os.path.exists(tarDir1):
        os.makedirs(tarDir1)
    if not os.path.exists(tarDir2):
        os.makedirs(tarDir2)

    joblib.dump(temp, os.path.join(tarDir1, 'SALT_' + str(day) + '.pkl'))
    joblib.dump(salt, os.path.join(tarDir2, 'TEMP_' + str(day) + '.pkl'))



