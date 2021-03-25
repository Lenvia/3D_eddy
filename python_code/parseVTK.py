import sys
import vtk
import numpy as np
from vtk.util.numpy_support import vtk_to_numpy

from pyevtk.hl import pointsToVTK

day_num = 30  # 默认有30天

reader = vtk.vtkPolyDataReader()
reader.SetFileName('/Users/yy/Desktop/force_2_pp_10000.vtk')
reader.ReadAllScalarsOn()
reader.ReadAllVectorsOn()
reader.Update()

polydata = reader.GetOutput()  # 获取输出
points = polydata.GetPoints()  # 模型点集

numpy_nodes = vtk_to_numpy(points.GetData())  # 点集转化为np.array形式

pointData = polydata.GetPointData()  # 点的属性数据

# print(polydata)
# print(pointData)
print(numpy_nodes)

numpy_simu_time = vtk_to_numpy(pointData.GetArray(1))  # # SimulationTime数组


point_sources = []  # point_sources.shape[0]表示天数
for i in range(day_num):
    point_sources.append([])  # 初始化

# for i in range(polydata.GetNumberOfCells()):  # 对于每一条线
#     cell = polydata.GetCell(i)
#     cnt = cell.GetNumberOfPoints()  # 一条线里点的个数
#
#     pts = cell.GetPoints()
#     for j in range(cnt):  # 对于每一个点
#         pt = np.array(pts.GetPoint(j))
#         point_sources[j].append(pt)  # 第j天的点添加这个点

for i in range(numpy_simu_time.shape[0]):
    point_sources[int(numpy_simu_time[i])].append(numpy_nodes[i])


# 把list转为np数组
point_sources = np.array(point_sources)

for i in range(point_sources.shape[0]):
    print("day: %d" % i)
    print("number: %d" % len(point_sources[i]))
    point_sources[i] = np.array(point_sources[i])
    print(point_sources[i])
    print()

'''
    写入文件
'''

# print(point_sources[0])
# # xyz坐标
# x = point_sources[0][:, 0]
# y = point_sources[0][:, 1]
# z = point_sources[0][:, 2]
for i in range(day_num):
    Points = vtk.vtkPoints()
    Vertices = vtk.vtkCellArray()

    # pointsToVTK("./points", x, y, z)

    for index in range(point_sources[i].shape[0]):
        id = Points.InsertNextPoint(point_sources[i][index])
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
    writer.SetFileName("/Users/yy/Desktop/points_force_2_pp_10000/Points"+str(i)+".vtk")
    if vtk.VTK_MAJOR_VERSION <= 5:
        writer.SetInput(polydata)
    else:
        writer.SetInputData(polydata)
    writer.Write()