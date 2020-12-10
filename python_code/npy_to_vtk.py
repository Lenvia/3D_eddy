import vtk
import vtk.util.numpy_support as numpy_support
from vtk.util.numpy_support import  numpy_to_vtk, vtk_to_numpy
import numpy as np
import os


def write_vtk(vec,file_name):
    # 读出来numpyarray传到vec，file-name是输出
    dims = vec.shape
    # print(dims)  # (500, 500, 50, 3)  应该是（纬度，经度，层数）
    x = np.arange(0, 1, 1/dims[1], dtype='float64')
    # print(len(x))
    y = np.arange(0, 1, 1/dims[0], dtype='float64')
    if dims[-1] == 2:  # 判断是否是二维
        # dims[-1]存的是维数
        z = np.array([0], dtype='float64')
    else:
        z = np.arange(0, 1, 1/dims[2], dtype='float64')
    x_coo = numpy_support.numpy_to_vtk(num_array=x, deep=True, array_type=vtk.VTK_FLOAT)
    y_coo = numpy_support.numpy_to_vtk(num_array=y, deep=True, array_type=vtk.VTK_FLOAT)
    z_coo = numpy_support.numpy_to_vtk(num_array=z, deep=True, array_type=vtk.VTK_FLOAT)

    rgrid = vtk.vtkRectilinearGrid()
    rgrid.SetDimensions(len(x),len(y),len(z))
    rgrid.SetXCoordinates(x_coo)
    rgrid.SetYCoordinates(y_coo)
    rgrid.SetZCoordinates(z_coo)
    vectors = vtk.vtkFloatArray()
    vectors.SetNumberOfComponents(3)
    vectors.SetNumberOfTuples(len(x)*len(y)*len(z))
    for k in range(0,len(z)):
        kOffset = k * len(x) * len(y)
        for j in range(0, len(y)):
            jOffset = j * len(x)
            for i in range(0, len(x)):
                if dims[-1] == 2:
                    vector = [vec[j,i,0], vec[j,i,1],0]
                else:
                    vector = [vec[j,i, k, 0], vec[j,i, k, 1], vec[j,i,k,2]]
                offset = i + jOffset + kOffset
                vectors.InsertTuple(offset, vector)
    rgrid.GetPointData().SetVectors(vectors)
    writer = vtk.vtkRectilinearGridWriter()
    writer.SetFileName(file_name)
    writer.SetInputData(rgrid)
    writer.Write()
    print("Write done!\n", file_name, "\n")


if __name__ == '__main__':
    start_day = 4
    start_index = 13
    projDir = os.getcwd()
    subRoot = str(start_day) + '-' + str(start_index)

    npz_path = os.path.join(projDir, 'npy_file', subRoot)

    files = os.listdir(npz_path)
    for file in files:
        npz_file = np.load(npz_path + '/' + file, allow_pickle=True)
        npz_file = npz_file.item()

        liquid_array = np.array(npz_file['x'])

        tarDir = os.path.join('vtk_file', subRoot)
        if not os.path.exists(tarDir):
            os.makedirs(tarDir)

        vtk_path = os.path.join(tarDir, file.split('.')[0]+'.vtk')
        write_vtk(liquid_array, vtk_path)

    # vtk_data = numpy_to_vtk(npz, array_type=vtk.VTK_UNSIGNED_CHAR)
    #
    # stlWriter = vtk.vtkSTLWriter()
    # stlWriter.SetFileName('0_0_0.vtk')
    # stlWriter.SetInputConnection(vtk_data.GetOutputPort())
    # stlWriter.Write()

