import netCDF4 as nc
import numpy as np
import pandas as pd

filename = 'COMBINED_2011013100.nc'   # .nc文件名
f = nc.Dataset(filename)   # 读取.nc文件，传入f中。此时f包含了该.nc文件的全部信息

all_vars = f.variables.keys()   # 获取所有变量名称
# print(all_vars)
all_vars_info = f.variables.items()  # 获取所有变量信息
all_vars_info = list(all_vars_info)  # 此时每个变量的信息为其中一个列表

# 13个变量的信息
# time, longitude, latitude, longitude, latitude, depth, ?, temp, salt, u, v, eta, W
# T_AX, XC, YC, XG, YG, Z_MIT40, Z_MIT40_bnds, TEMP, SALT, U, V, ETA, W
for i in all_vars_info:
    print(i, '\n')

# 查看变量关系表
# 最直接的办法，获取每个变量的缩写名字，标准名字(long_name),units和shape大小。这样很方便后续操作
all_vars_name = []
# all_vars_long_name = []
# all_vars_units = []
all_vars_shape = []

# f1 = f
# for key in f1.variables.keys():  # 只有0~6到最后才使用的standard_name，后面没有
#     all_vars_name.append(key)
#     all_vars_shape.append(f1.variables[key].shape)
#
# # 做成表格
# a_vars_info = pd.DataFrame(all_vars_name, columns=['name'])
# # a_vars_info['long_name'] = all_vars_long_name
# # a_vars_info['units'] = all_vars_units
# a_vars_info['shape'] = all_vars_shape
#
# print(a_vars_info)
# print()

# 提取 U V W的数据
# 查看var的信息
# varSet = ['XC', 'XG', 'YC', 'YG']
# # 声明空的np数组
# XC = np.array([], dtype=np.float32)
# XG = np.array([], dtype=np.float32)
# YC = np.array([], dtype=np.float32)
# YG = np.array([], dtype=np.float32)
#
# # 赋值
# for i, var in enumerate(varSet):
#     var_info = f.variables[var]  # 获取变量信息
#     var_data = f[var][:]  # 获取变量的数据
#     # print(var_info)
#     # print()
#     var_data = np.array(var_data)  # 转化为np.array数组
#     # print(i, var, '\n')
#     if i == 0:
#         XC = var_data
#     if i == 1:
#         XG = var_data
#     if i == 2:
#         YC = var_data
#     else:
#         YG = var_data

# print(XC[414:425])
# print(XG)
# print(YC[55:66])
# print(YG)

# print(XC)
# print(YC)

# f.close()  # 关闭文件。如果文件关闭后，再使用f.variabels.items()等操作是行不通的。
