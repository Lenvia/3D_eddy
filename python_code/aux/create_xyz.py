import pandas as pd
import plotly
import plotly.graph_objs as go
import vtk
from vtk.util.numpy_support import vtk_to_numpy
import joblib
import numpy as np
import netCDF4 as nc4
import os

scaleHeight = 20 / 200000
depth = joblib.load("../shared/depth.pkl")
xyz_data_path = 'xyz_data'
xyz_file_path = 'xyz_file'

f = nc4.Dataset("../ensemble1Eddies.nc", 'r', format='NETCDF4')  # 'r' stands for read
for day in range(2, 3):
    data = f.variables['isEddy'][:][day]  # 第0天
    data = data.transpose([2, 1, 0])  # 经度 纬度 深度

    flag = np.zeros(data.shape)
    data2 = joblib.load("../whole_attributes_pkl_file/TEMP/TEMP_" + str(day) + ".pkl")  # 温度属性

    myfile = open(os.path.join(xyz_file_path, "output_" + str(day) + ".xyz"), "w")

    xdata = []
    ydata = []
    zdata = []
    value = []

    minV = 100
    maxV = 0

    for k in range(0, 50):
        print(k)
        if k == 0:  # 第一层不间隔
            for i in range(0, 500):
                for j in range(0, 500):
                    if data[i][j][k] != 0 and data2[i][j][k] != 0:
                        flag[i][j][k] = 1
                        print(i, j, k)
        else:
            for i in range(0, 500, 2):
                for j in range(0, 500, 2):
                    if data[i][j][k] != 0 and data2[i][j][k] != 0:
                        flag[i][j][k] = 1
                        print(i, j, k)

    for k in range(0, 50):
        print(k)
        if k == 0:  # 第一层不间隔
            for i in range(0, 500):
                for j in range(0, 500):
                    # 保留条件：全部保留
                    if flag[i][j][k] == 1:
                        v = data2[i][j][k]
                        if v != 0:
                            minV = min(minV, v)
                            maxV = max(maxV, v)

                            xdata.append(i)
                            ydata.append(j)
                            zdata.append(k)
                            value.append(v)
        else:
            for i in range(0, 500, 2):
                for j in range(0, 500, 2):
                    # 保留条件：这个点是边界 或者 其四周存在不为1的
                    if flag[i][j][k] == 1:
                        if i == 0 or j == 0 or k == 0 or i == 498 or j == 498 or k == 48 or \
                                flag[i - 2][j][k] == 0 or flag[i + 2][j][k] == 0 or flag[i][j - 2][k] == 0 or \
                                flag[i][j + 2][k] == 0:
                            v = data2[i][j][k]
                            if v != 0:
                                minV = min(minV, v)
                                maxV = max(maxV, v)

                                xdata.append(i)
                                ydata.append(j)
                                zdata.append(k)
                                value.append(v)

    joblib.dump(xdata, os.path.join(xyz_data_path, "xdata_" + str(day) + ".pkl"))
    joblib.dump(ydata, os.path.join(xyz_data_path, "ydata_" + str(day) + ".pkl"))
    joblib.dump(zdata, os.path.join(xyz_data_path, "zdata_" + str(day) + ".pkl"))
    joblib.dump(value, os.path.join(xyz_data_path, "value_" + str(day) + ".pkl"))

    # xdata = joblib.load(os.path.join(xyz_data_path, "xdata_"+str(day)+".pkl"))
    # ydata = joblib.load(os.path.join(xyz_data_path, "ydata_"+str(day)+".pkl"))
    # zdata = joblib.load(os.path.join(xyz_data_path, "zdata_"+str(day)+".pkl"))
    # value = joblib.load(os.path.join(xyz_data_path, "value_"+str(day)+".pkl"))

    xnormal = []
    ynormal = []
    znormal = []

    # 设置法向量
    for i in range(len(xdata)):
        xnormal.append(xdata[i] / 500 - 0.5)
        ynormal.append(ydata[i] / 500 - 0.5)
        znormal.append(0.5 - zdata[i] / 50)

    minV = np.min(value)
    maxV = np.max(value)

    # 映射深度
    # for i in range(len(zdata)):
    #     zdata[i] = -depth[zdata[i]]

    # 缩放
    xdata = np.array(xdata) / 500  # 横向间距0.002
    ydata = np.array(ydata) / 500
    # zdata = np.array(zdata)*scaleHeight
    zdata = np.array(zdata) / 50 / 5 * (-1)  # 间距 0.002，范围0~0.1

    xnormal = np.array(xnormal)
    ynormal = np.array(ynormal)
    znormal = np.array(znormal)

    print("赋值完毕")
    value = np.array(value)
    value = (value - minV) / (maxV - minV)  # 归一化

    G = (1 - value) * 255  # G通道，value值越大G越小，越红

    for i in range(len(xdata)):
        # print(xdata[i], ydata[i], zdata[i], 255, G[i], 0, xnormal[i], ynormal[i], znormal[i])
        myfile.write("%s\t %s\t %s\t %s\t %s\t %s\t %s\t %s\t %s\n" % (
        xdata[i], ydata[i], zdata[i], 255, G[i], 0, xnormal[i], ynormal[i], znormal[i]))

    myfile.close()

    print("xyz文件写入完毕")

    '''
        ---------------------------------------------------------------------------------
    '''
    # 将点导出到vtk文件
    Points = vtk.vtkPoints()
    Vertices = vtk.vtkCellArray()

    # pointsToVTK("./points", x, y, z)

    for i in range(len(xdata)):
        id = Points.InsertNextPoint([xdata[i], ydata[i], zdata[i]])
        Vertices.InsertNextCell(1)
        Vertices.InsertCellPoint(id)

    polydata = vtk.vtkPolyData()
    polydata.SetPoints(Points)
    polydata.SetVerts(Vertices)
    polydata.Modified()

    if vtk.VTK_MAJOR_VERSION <= 5:
        polydata.Update()

    # writer = vtk.vtkXMLPolyDataWriter()
    writer = vtk.vtkPolyDataWriter()
    writer.SetFileName("/Users/yy/Desktop/3D_points/3d_points" + str(day) + ".vtk")
    if vtk.VTK_MAJOR_VERSION <= 5:
        writer.SetInput(polydata)
    else:
        writer.SetInputData(polydata)
    writer.Write()

    print("3d粒子生成完毕")
