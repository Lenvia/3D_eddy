import numpy as np
import matplotlib.pyplot as plt
import scipy.io as scio
import netCDF4 as nc4


def invert(list1):
    return [row[::-1] for row in list1]


def transpose(list1):
    return [list(row) for row in zip(*list1)]


f2 = nc4.Dataset("../3dAttr1.nc", 'r', format='NETCDF4')  # 'r' stands for read
circ = f2.variables['circ'][:][0]
circ = circ.transpose([2, 1, 0])


shapeFile = '../result/eddyInfo/0/0-30/0-30.mat'
shape = scio.loadmat(shapeFile)['eddie_mask']

shapeFile = '../result/eddyInfo/0/0-31/0-31.mat'
shape2 = scio.loadmat(shapeFile)['eddie_mask']

shape = shape+shape2
shape = np.multiply(shape, circ)


a = shape[125:175, 350:450, 3]

a = invert(a)
a = transpose(a)

plt.imshow(a, cmap=plt.get_cmap('seismic'), vmin=-2, vmax = 2)
plt.colorbar()
plt.show()

# print(a)