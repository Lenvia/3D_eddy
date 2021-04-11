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

scaleHeight = 20 / 200000
depth = joblib.load("../shared/depth.pkl")
xyz_data_path = 'xyz_data'
xyz_file_path = 'xyz_file'

f = nc4.Dataset("../ensemble1Eddies.nc", 'r', format='NETCDF4')  # 'r' stands for read
f2 = nc4.Dataset("../3dAttr1.nc", 'r', format='NETCDF4')  # 'r' stands for read
for day in range(0, 1):
    isEddy = f.variables['isEddy'][:][day]  # 第0天
    isEddy = isEddy.transpose([2, 1, 0])  # 经度 纬度 深度

    # circ = f2.variables['circ'][:][day]
    # circ = circ.transpose([2, 1, 0])

    TEMP = joblib.load("../whole_attributes_pkl_file/TEMP/TEMP_" + str(day) + ".pkl")  # 温度属性

    # isEddy = mcubes.smooth(isEddy)

    # color = np.random.rand(500, 500, 50, 3)
    # color = 0.05 * np.concatenate((TEMP[:, :, :, None], TEMP[:, :, :, None], TEMP[:, :, :, None]), axis=3)
    X, Y, Z = np.mgrid[:500, :500, :50]
    color = 0.1 * np.random.rand() * np.concatenate((X[:, :, :, None], Y[:, :, :, None], Z[:, :, :, None]), axis=3)

    vertices_color, triangles_color = mcubes.marching_cubes_color(2*isEddy, color, 1)
    mcubes.export_obj(vertices_color, triangles_color, "isEddy_color.obj")

    # print("Example 2: Isosurface and color in NumPy volume...")
    #
    # # Create a data volume (100 x 100 x 100)
    # X, Y, Z = np.mgrid[:10, :10, :10]
    # sdf = (X - 5) ** 2 + (Y - 5) ** 2 + (Z - 5) ** 2 - 2.5 ** 2
    #
    # print(sdf)
    # # print(sdf.shape)
    #
    # # Extract isosurface and color
    # color = 0.1 * np.concatenate((X[:, :, :, None], Y[:, :, :, None], Z[:, :, :, None]), axis=3)  # color array (positions as color)
    #
    # # print(color.shape)
    #
    # vertices_color, triangles_color = mcubes.marching_cubes_color(sdf, color, 0)
    # mcubes.export_obj(vertices_color, triangles_color, "sphere_color.obj")