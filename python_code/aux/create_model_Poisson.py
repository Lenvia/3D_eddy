import numpy as np
import open3d as o3d


def lod_mesh_export(mesh, lods, extension, path):
    mesh_lods={}
    for i in lods:
        mesh_lod = mesh.simplify_quadric_decimation(i)
        o3d.io.write_triangle_mesh(path+"lod_"+str(i)+extension, mesh_lod)
        mesh_lods[i]=mesh_lod
    print("generation of "+str(i)+" LoD successful")
    return mesh_lods


day = 2
max_pieces = 1000000
input_path = "./xyz_file/"
output_path = "./models_poisson/"


def generateMesh():
    dataname = "output_"+str(day)+".xyz"
    point_cloud = np.loadtxt(input_path+dataname,skiprows=0)

    print(point_cloud.shape)
    # print(point_cloud)

    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(point_cloud[:,:3])
    pcd.colors = o3d.utility.Vector3dVector(point_cloud[:,3:6]/255)
    pcd.normals = o3d.utility.Vector3dVector(point_cloud[:,6:9])
    #
    # o3d.visualization.draw_geometries([pcd])

    poisson_mesh = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(pcd, depth=8, width=0, scale=1.1, linear_fit=False)[0]
    bbox = pcd.get_axis_aligned_bounding_box()
    p_mesh_crop = poisson_mesh.crop(bbox)
    print("正在写入...")
    o3d.io.write_triangle_mesh(output_path + "p_mesh_c_" + str(day) + ".ply", p_mesh_crop)



p_mesh_crop = o3d.io.read_triangle_mesh(output_path+"p_mesh_c_"+str(day)+".ply")
# 加载
my_lods = lod_mesh_export(p_mesh_crop, [max_pieces], ".ply", output_path)

o3d.visualization.draw_geometries([my_lods[max_pieces]])


