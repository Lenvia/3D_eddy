import sys
import vtk
import numpy as np
from vtk.util.numpy_support import vtk_to_numpy

day_num = 30  # 默认有30天

reader = vtk.vtkPolyDataReader()
reader.SetFileName('/Users/yy/Desktop/particle_path.vtk')
reader.ReadAllScalarsOn()
reader.ReadAllVectorsOn()
reader.Update()

polydata = reader.GetOutput()  # 获取输出
points = polydata.GetPoints()  # 模型点集
array = points.GetData()
numpy_nodes = vtk_to_numpy(array)  # 点集转化为np.array形式

'''
   假设模型有n条line，某条line包含m个点
   那么第k个点就属于第k天
   我们需要把所有线的第k个点放入第k天
'''

point_sources = []  # point_sources.shape[0]表示天数
for i in range(day_num):
    point_sources.append([])  # 初始化

for i in range(polydata.GetNumberOfCells()):  # 对于每一条线
    cell = polydata.GetCell(i)
    cnt = cell.GetNumberOfPoints()  # 一条线里点的个数

    pts = cell.GetPoints()
    for j in range(cnt):  # 对于每一个点
        pt = np.array(pts.GetPoint(j))
        point_sources[j].append(pt)  # 第j天的点添加这个点

# 把list转为np数组
point_sources = np.array(point_sources)

for i in range(point_sources.shape[0]):
    print("day: %d" % i)
    print("number: %d" % len(point_sources[i]))
    point_sources[i] = np.array(point_sources[i])
    print(point_sources[i])
    print()

