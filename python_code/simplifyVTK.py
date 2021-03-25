import sys
import vtk
import numpy as np
import os

# list_path = "/Users/yy/Desktop/local_vtk_folder/temp_force_2_pp_10000"
# new_path = "/Users/yy/Desktop/local_vtk_folder/force_2_pp_10000"

# list_path = "/Users/yy/Desktop/pps_whole_vtk_file/temp_force_2_pp_10000"
# new_path = "/Users/yy/Desktop/pps_whole_vtk_file/force_2_pp_10000"

list_path = "/Users/yy/Desktop/qqq"
new_path = "/Users/yy/Desktop/qqq1"

files = os.listdir(list_path)

for file in files:
    flag = 0
    name = file
    with open(list_path+'/'+file,"r",encoding="utf-8") as f:
        if file == '.DS_Store':
            continue
        lines = f.readlines()
        # print(lines)

    # 从删除的第一行开始，flag设为1
    if not os.path.exists(new_path):
        os.makedirs(new_path)
    with open(new_path+'/'+name,"w",encoding="utf-8") as f_w:
        for line in lines:
            # if flag == 0 and "CELL_TYPES" in line:
            if flag == 0 and "CELL_TYPES" in line:
                flag = 1
            if flag:
                continue
            f_w.write(line)
