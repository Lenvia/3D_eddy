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
f2 = nc4.Dataset("../3dAttr1.nc", 'r', format='NETCDF4')  # 'r' stands for read
for day in range(0, 1):
    # isEddy = f.variables['isEddy'][:][day]  # 第0天
    # isEddy = isEddy.transpose([2, 1, 0])  # 经度 纬度 深度

    circ = f2.variables['circ'][:][day]
    circ = circ.transpose([2, 1, 0])

    TEMP = joblib.load("../whole_attributes_pkl_file/TEMP/TEMP_" + str(day) + ".pkl")  # 温度属性

    myfile = open(os.path.join(xyz_file_path, "output_" + str(day) + ".xyz"), "w")

    xdata = []
    ydata = []
    zdata = []
    value = []

    minV = 100
    maxV = 0

    for k in range(0, 50):
        print(k)
        for i in range(0, 500):
            for j in range(0, 500):
                c = circ[i][j][k]
                v= TEMP[i][j][k]
                if c != 0 and v != 0:
                    v = TEMP[i][j][k]
                    minV = min(minV, v)
                    maxV = max(maxV, v)

                    xdata.append(i)
                    ydata.append(j)
                    zdata.append(k)

                    if c > 0:  # 气旋
                        value.append(v)
                    else:  # 反气旋
                        value.append(-v)

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

    value = np.array(value)
    value_abs = np.maximum(value, -value)  # 温度的绝对值，用来挑选温度最高和最低的

    minV = np.min(value_abs)
    maxV = np.max(value_abs)
    diff = maxV - minV

    # 缩放
    xdata = np.array(xdata) / 500  # 横向间距0.002
    ydata = np.array(ydata) / 500
    # zdata = np.array(zdata)*scaleHeight
    zdata = np.array(zdata) / 50 / 10 * (-1)  # 间距 0.002，范围0~0.1

    xnormal = np.array(xnormal)
    ynormal = np.array(ynormal)
    znormal = np.array(znormal)

    print("赋值完毕")

    R = []
    G = []
    B = []

    for i in range(len(value)):
        if value[i] > 0:  # 气旋
            value[i] = (value[i] - minV) / diff

            R.append(255)
            G.append((1 - value[i]) * 255)  # G通道，value值越大G越小，越红。即气旋温度越高越红
            B.append(0)

        else:
            value[i] = (value[i] + minV) / diff

            R.append(0)
            G.append(-value[i]*255)  # # G通道，value值越大G越大，越不蓝。
            B.append(255)

    # value = (value - minV) / (maxV - minV)  # 归一化

    R = np.array(R)
    G = np.array(G)
    B = np.array(B)

    for i in range(len(xdata)):
        print(xdata[i], ydata[i], zdata[i], R[i], G[i], B[i])
        myfile.write("%s\t %s\t %s\t %s\t %s\t %s\t %s\t %s\t %s\n" % (
        xdata[i], ydata[i], zdata[i], R[i], G[i], B[i], xnormal[i], ynormal[i], znormal[i]))

    myfile.close()

    print("xyz文件写入完毕")

    '''
        ---------------------------------------------------------------------------------
    '''
    # 将点导出到vtk文件
    # Points = vtk.vtkPoints()
    # Vertices = vtk.vtkCellArray()
    #
    # # pointsToVTK("./points", x, y, z)
    #
    # for i in range(len(xdata)):
    #     id = Points.InsertNextPoint([xdata[i], ydata[i], zdata[i]])
    #     Vertices.InsertNextCell(1)
    #     Vertices.InsertCellPoint(id)
    #
    # polydata = vtk.vtkPolyData()
    # polydata.SetPoints(Points)
    # polydata.SetVerts(Vertices)
    # polydata.Modified()
    #
    # if vtk.VTK_MAJOR_VERSION <= 5:
    #     polydata.Update()
    #
    # # writer = vtk.vtkXMLPolyDataWriter()
    # writer = vtk.vtkPolyDataWriter()
    # writer.SetFileName("/Users/yy/Desktop/3D_points/3d_points" + str(day) + ".vtk")
    # if vtk.VTK_MAJOR_VERSION <= 5:
    #     writer.SetInput(polydata)
    # else:
    #     writer.SetInputData(polydata)
    # writer.Write()
    #
    # print("3d粒子生成完毕")
