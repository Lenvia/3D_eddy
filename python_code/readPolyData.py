import vtk
from vtk.util import numpy_support as VN
from vtk.numpy_interface import dataset_adapter as dsa



def main():
    colors = vtk.vtkNamedColors()

    filename = './dg_line.vtk'

    # Read all the data from the file
    reader = vtk.vtkPolyDataReader() # .vtk file
    # reader = vtk.vtkXMLPolyDataReader() #.vtp file
    reader.SetFileName(filename)
    reader.ReadAllScalarsOn()
    reader.ReadAllVectorsOn()
    reader.Update()

    # polydata = vtk.vtkPolyData()
    # polydata.ShallowCopy(reader.GetOutput())
    # print(reader.GetNumberOfLines())
    # polyline_num = polydata.GetNumberOfLines() #有line的个数，但是GetLines()是None Types？？？
    # num=polydata.GetNumberOfCells()
    # polydata.GetCell(0)

    polydata = reader.GetOutput()
    # np_points = dsa.WrapDataObject(polydata).Points

    print(polydata)

    print(polydata.GetPoints())
    points = polydata.GetPoints().GetData()
    np_points = VN.vtk_to_numpy(points)
    print(np_points)






if __name__ == '__main__':
    main()