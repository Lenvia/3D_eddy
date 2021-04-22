import pandas as pd
import plotly
import plotly.graph_objs as go
import vtk
from vtk.util.numpy_support import vtk_to_numpy
import joblib
import numpy as np
import netCDF4 as nc4
import os
import marching_cubes as mcubes
import scipy.io as scio


# f = nc4.Dataset("../Eddies.nc", 'r', format='NETCDF4')  # 'r' stands for read
# f2 = nc4.Dataset("../3dAttr2.nc", 'r', format='NETCDF4')  # 'r' stands for read

f = nc4.Dataset("../Eddies.nc", 'r', format='NETCDF4')  # 'r' stands for read
f2 = nc4.Dataset("../3dAttr1.nc", 'r', format='NETCDF4')  # 'r' stands for read
for day in range(0, 10):
    isEddy = f.variables['isEddy'][:][day]  # 第0天
    isEddy = isEddy.transpose([2, 1, 0])  # 经度 纬度 深度

    circ = f2.variables['circ'][:][day]
    circ = circ.transpose([2, 1, 0])


    attr = joblib.load("../whole_attributes_pkl_file/TEMP/TEMP_" + str(day) + ".pkl")  # 温度属性
    # 将temp非零部分归一化（0的地方不用考虑，最后形状等值面会给过滤掉）
    attr_max = np.max(attr)
    attr_min = min(25, np.min(attr[np.nonzero(attr)]))
    diff = attr_max - attr_min

    # 归一化
    attr = (attr - attr_min) / diff

    attr[np.where(attr < 0)] = 0  # 把小于最小值的那些点的位置都设为0

    attr = np.multiply(attr, circ)

    # attr = circ

    # print(np.max(attr))

    pos_index = np.where(attr > 0)  # 大于0的索引
    neg_index = np.where(attr < 0)  # 小于0的索引

    X = np.zeros((500, 500, 50))
    Y = np.zeros((500, 500, 50))
    Z = np.zeros((500, 500, 50))

    X[pos_index] = 1
    Y[pos_index] = 1 - attr[pos_index]
    Z[pos_index] = 0

    X[neg_index] = 0
    Y[neg_index] = - attr[neg_index]
    Z[neg_index] = 1


    isEddy = mcubes.smooth(isEddy)

    # X = np.multiply(X, isEddy)
    # Y = np.multiply(Y, isEddy)
    # Z = np.multiply(Z, isEddy)

    color = np.concatenate((X[:, :, :, None], Y[:, :, :, None], Z[:, :, :, None]), axis=3)

    vertices_color, triangles_color = mcubes.marching_cubes_color(isEddy, color, 1)
    mcubes.export_obj(vertices_color, triangles_color, "isEddy_color_"+str(day)+".obj")

    # vertices_color, triangles_color = mcubes.marching_cubes_color(isEddy, color, 1)
    # mcubes.export_obj(vertices_color, triangles_color, "test" + str(day) + ".obj")