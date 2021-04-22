# 读入unstructuredData，寻找local maximum
import numpy as np
import vtk
from vtk.util import numpy_support as VN

filename = "./time66.vtk"  # 需要vtk 9.0.1版本

reader = vtk.vtkUnstructuredGridReader()
reader.SetFileName(filename)
reader.SetFileName(filename)
reader.ReadAllScalarsOn()
reader.ReadAllVectorsOn()
reader.Update()

data = reader.GetOutput()
points = data.GetPoints()
# time_1 = data.GetCellData().GetArray("Data_@_t=0")
velocity = data.GetPointData().GetArray(0)
# name_1 = data.GetPointData().GetArrayName(0)
print(velocity)
