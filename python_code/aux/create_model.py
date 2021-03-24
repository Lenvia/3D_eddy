import numpy as np
import open3d as o3d

max_pieces = 1000000
input_path = "./xyz_file/"
output_path = "./models/"


def lod_mesh_export(mesh, lods, extension, path):
    mesh_lods={}
    for i in lods:
        mesh_lod = mesh.simplify_quadric_decimation(i)
        o3d.io.write_triangle_mesh(path+"lod_"+str(i)+extension, mesh_lod)
        mesh_lods[i]=mesh_lod
    print("generation of "+str(i)+" LoD successful")
    return mesh_lods


def generateMesh(day):
    dataname = "output_" + str(day) + ".xyz"
    point_cloud = np.loadtxt(input_path + dataname, skiprows=0)
    print(point_cloud.shape)
    # print(point_cloud)

    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(point_cloud[:,:3])
    pcd.colors = o3d.utility.Vector3dVector(point_cloud[:,3:6]/255)
    pcd.normals = o3d.utility.Vector3dVector(point_cloud[:,6:9])
    #
    # o3d.visualization.draw_geometries([pcd])

    distances = pcd.compute_nearest_neighbor_distance()
    avg_dist = np.mean(distances)
    print(avg_dist)
    radius = 2*avg_dist

    bpa_mesh = o3d.geometry.TriangleMesh.create_from_point_cloud_ball_pivoting(pcd,o3d.utility.DoubleVector([radius, radius * 2]))

    dec_mesh = bpa_mesh.simplify_quadric_decimation(max_pieces)

    print("去除重复...")
    dec_mesh.remove_degenerate_triangles()
    dec_mesh.remove_duplicated_triangles()
    dec_mesh.remove_duplicated_vertices()
    dec_mesh.remove_non_manifold_edges()

    print("正在写入...")
    o3d.io.write_triangle_mesh(output_path+"bpa_mesh_"+str(day)+".ply", dec_mesh)


def show(day):
    bpa_mesh = o3d.io.read_triangle_mesh(output_path+"bpa_mesh_"+str(day)+".ply")
    my_lods = lod_mesh_export(bpa_mesh, [max_pieces], ".ply", output_path)
    o3d.visualization.draw_geometries([my_lods[max_pieces]])


if __name__ == '__main__':
    generateMesh(0)
    show(0)
