import numpy as np

from plyfile import PlyData, PlyElement


input_path = "./xyz_file/"
output_path = "./clouds/"


def write_ply_label(day):
    filename = output_path+"point_cloud_"+str(day)+".ply"
    dataname = "output_" + str(day) + ".xyz"
    point_cloud = np.loadtxt(input_path + dataname, skiprows=0)
    print(point_cloud.shape)

    points = point_cloud[:,:3]
    colors = point_cloud[:,3:6]

    N = points.shape[0]

    vertex = []

    for i in range(N):
        c = colors[i]
        vertex.append((points[i, 0], points[i, 1], points[i, 2], c[0], c[1], c[2]))

    vertex = np.array(vertex,
                      dtype=[('x', 'f4'), ('y', 'f4'), ('z', 'f4'), ('red', 'u1'), ('green', 'u1'), ('blue', 'u1')])

    print(vertex)
    el = PlyElement.describe(vertex, 'vertex', comments=['vertices'])
    PlyData([el], text=True).write(filename)


if __name__ == '__main__':
    write_ply_label(0)


