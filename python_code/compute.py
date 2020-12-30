import datetime
import joblib
import sys
import numpy as np
from sympy import *
from math import radians, cos, sin, asin, sqrt, fabs, ceil
import os
import json

# 全局常量
d0 = 100
r0 = 50
xi0 = 1e-5
eke0 = 1000

w1 = 1
w2 = 1
w3 = 0.05
w4 = 0.01

days = []
indices = []
level_num = []
lon_set = []
lat_set = []
x_pos = []  # 在paraview上的x坐标
y_pos = []  # 在paraview上的y坐标
points = []  # 35层大概需要10万  14层4万

# 默认是60天
for i in range(60):
    days.append(i)

up_bound = -1


def load_common(tar_dir):
    t = joblib.load(tar_dir + '/t.pkl')
    lon_arr = joblib.load(tar_dir + '/lon.pkl')
    lat_arr = joblib.load(tar_dir + '/lat.pkl')
    return t, lon_arr, lat_arr


def load_pkl(tar_dir):
    uvel = joblib.load(tar_dir + '/uvel.pkl')
    vvel = joblib.load(tar_dir + '/vvel.pkl')
    vorticity = joblib.load(tar_dir + '/vorticity.pkl')
    OW = joblib.load(tar_dir + '/OW.pkl')
    OW_eddies = joblib.load(tar_dir + '/OW_eddies.pkl')
    eddie_census = joblib.load(tar_dir + '/eddie_census.pkl')
    nEddies = joblib.load(tar_dir + '/nEddies.pkl')
    circulation_mask = joblib.load(tar_dir + '/circulation_mask.pkl')
    level_arr = joblib.load(tar_dir + '/levels.pkl')

    return uvel, vvel, vorticity, OW, OW_eddies, eddie_census, nEddies, circulation_mask, level_arr


# 计算两点间距离
def geodistance(lon1, lat1, lon2, lat2):
    print("(%f, %f) (%f, %f)" % (lon1, lat1, lon2, lat2))
    # 这里用km
    R = 6371 * 1000
    lon1, lat1, lon2, lat2 = map(radians, [float(lon1), float(lat1), float(lon2), float(lat2)])  # 经纬度转换成弧度
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    distance = 2 * asin(sqrt(a)) * R  # 地球平均半径，6371km
    distance = round(distance, 3)
    return distance/1000  # 返回km为单位


def get_lon_index(lon_arr, lon1):
    lon_index = -1
    for i in range(len(lon_arr)):
        if lon_arr[i] == lon1:
            lon_index = i
            break
    return lon_index


def get_lat_index(lat_arr, lat1):
    lat_index = -1
    for i in range(len(lat_arr)):
        if lat_arr[i] == lat1:
            lat_index = i
            break
    return lat_index


def search(day1, day2, index1, flag=0):
    if day2 > up_bound:
        return

    tarDir1 = 'result/small' + str(day1)
    tarDir2 = 'result/small' + str(day2)
    t, lon_arr, lat_arr = load_common(tarDir1)

    uvel1, vvel1, vorticity1, OW1, OW_eddies1, eddie_census1, nEddies1, circulation_mask1, levels1 = load_pkl(tarDir1)
    uvel2, vvel2, vorticity2, OW2, OW_eddies2, eddie_census2, nEddies2, circulation_mask2, levels2 = load_pkl(tarDir2)
    eke1 = 0.5 * (uvel1 ** 2 + vvel1 ** 2)
    eke2 = 0.5 * (uvel2 ** 2 + vvel2 ** 2)

    # print(lon_arr.shape)  # 164
    # print(lat_arr.shape)  # 132
    # print(uvel1.shape)  # (164, 132, 50)
    # print(vvel1.shape)  # (164, 132, 50)
    # print(vorticity1.shape)  # (164, 132, 50)
    # print(circulation_mask1.shape)  # (164, 132, 50)

    '''
    dis, radius, vorticity, eke
    dis 需要经纬度
    radius 仅需index
    vorticity 需要经纬度下标
    eke需要经纬度下标
    '''

    # print(eddie_census1[-1])
    # print(eddie_census2[-1])

    # index1 = 2  # day1时间第几个涡旋
    lon1 = eddie_census1[2][index1]  # 涡核经度
    lat1 = eddie_census1[3][index1]  # 涡核纬度
    dia1 = eddie_census1[-1][index1]  # 涡旋直径
    level1 = levels1[index1]  # 涡旋层数
    lon_index1 = get_lon_index(lon_arr, lon1)  # 经度在数组中索引
    lat_index1 = get_lat_index(lat_arr, lat1)  # 纬度索引

    next_index = -1
    minDiff = 1e10

    if flag == 1:
        level_num.append(level1)
        lon_set.append(lon1)
        lat_set.append(lat1)


    next_level = -1
    next_lon = -1
    next_lat = -1
    for index2 in range(len(levels2)):  # 对于day2的所有涡旋
        print("day: %d, index2: %d" % (day2, index2))
        lon2 = eddie_census2[2][index2]  # 经度
        lat2 = eddie_census2[3][index2]  # 纬度
        dia2 = eddie_census2[-1][index2]  # 直径
        level2 = levels2[index2]  # 层数
        lon_index2 = get_lon_index(lon_arr, lon2)  # 经度索引
        lat_index2 = get_lat_index(lat_arr, lat2)  # 纬度索引

        # 两个涡核的距离
        delta_dis = geodistance(lon1, lat1, lon2, lat2)
        # 两个涡旋半径差
        delta_r = 0.5*(dia1 - dia2)

        # 两个涡旋所有层数，涡度差绝对值的平均值
        temp = np.abs(vorticity1[lon_index1][lat_index1] - vorticity2[lon_index2][lat_index2])
        delta_xi = np.sum(temp)/len(temp)

        # 两个涡度所有层数，eke差绝对值的平均值
        temp = np.abs(eke1[lon_index1][lat_index1] - eke2[lon_index2][lat_index2])
        delta_eke = np.sum(temp) / len(temp) * 1e4

        print("距离差: ", delta_dis)
        print("半径差: ", delta_r)
        print("涡度差: ", delta_xi)
        print("eke差: ", delta_eke)
        print(w1 * (delta_dis/d0)**2, w2 * (delta_r/r0)**2, w3 * (delta_xi/xi0)**2, w4 * (delta_eke/eke0)**2)

        curD = sqrt(w1 * (delta_dis/d0)**2 + w2 * (delta_r/r0)**2 + w3 * (delta_xi/xi0)**2 + w4 * (delta_eke/eke0)**2)
        print("D between %d and %d is %f" % (index1, index2, curD))
        print()

        if curD < minDiff:
            minDiff = curD
            next_index = index2
            next_level = level2
            next_lon = lon1
            next_lat = lat2


    if minDiff < 1:
        indices.append(next_index)
        level_num.append(next_level)
        lon_set.append(next_lon)
        lat_set.append(next_lat)
        print("-----------------------------------\n")
        search(day2, day2+1, next_index)
    else:  # 没找到，就跳过这一天
        indices.append(-1)
        level_num.append(-1)
        lon_set.append(-1)
        lat_set.append(-1)
        print("-----------------------------------\n")
        search(day1, day2+1, index1)


'''
    【2】追踪
'''
if __name__ == '__main__':
    start_day = 0
    start_index = 9
    up_bound = 34

    for i in range(start_day):
        indices.append(-1)
        level_num.append(-1)
        lon_set.append(-1)
        lat_set.append(-1)

    indices.append(start_index)
    search(start_day, start_day+1, start_index, 1)  # 开始追踪

    for i in range(len(indices)):
        if indices[i] == -1:
            x_pos.append(-1)
            y_pos.append(-1)
            points.append(-1)
        else:
            x_pos.append((lon_set[i]-30.2072)/20)
            y_pos.append((lat_set[i]-10.0271)/20)

            temp = ceil(level_num[i]*2/7)
            if temp < 3:
                temp = 3

            points.append(temp*10000)

    print("days:\n", days)  # 天数
    print("indices:\n", indices)  # 图上的第几个涡旋
    print("level_num:\n", level_num)  # 层数
    print("points:\n", points)  # 撒点数
    print("lon_set:\n", lon_set)  # 涡核经度集合
    print("lat_sat:\n", lat_set)  # 涡核纬度集合
    print("x_pos:\n", x_pos)
    print("y_pos:\n", y_pos)

    print(len(days), len(indices), len(level_num), len(points), len(lon_set), len(lat_set), len(x_pos), len(y_pos))

    track_dict = {"days": days, "indices": indices, "points": points,
                  "x_pos": x_pos, "y_pos": y_pos}
    site_dict = {"days": days, "indices": indices}

    # 写入追踪字典数据
    tarDir = 'track/'
    if not os.path.exists(tarDir):
        os.makedirs(tarDir)

    identifier = str(start_day)+'-'+str(start_index)
    file = os.path.join(tarDir, identifier)
    np.save(file, track_dict)

    # 写入时间和索引json数据
    site_json = json.dumps(site_dict, sort_keys=False)
    f = open(os.path.join(tarDir, identifier+'.json'), 'w')
    f.write(site_json)

    # day :   2  3  4  5  6   7  8  9  10 11 12  13  14 15  16 17 18 19 20
    # index : [1, 2, 1, 1, -1,
    #                         3, 2, 3, -1,
    #                                     5, -1, -1,
    #                                                 5, 0, 5, 6,
    #                                                             -1, -1, -1]
    # true : [1, 2, 1, 1, 无,
    #                         3, 2, 3, 无,
    #                                     5,  无, 无,  5, 0, 5, 6,
    #                                                              无, 无, 无]
