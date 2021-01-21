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

# 全局数据经纬度跨度
spanLon = 20
spanLat = 20
up_bound = 34

# 默认是60天
for i in range(60):
    days.append(i)


def load_common(tar_dir):
    t = joblib.load(tar_dir + '/t.pkl')
    lon_arr = joblib.load(tar_dir + '/lon.pkl')
    lat_arr = joblib.load(tar_dir + '/lat.pkl')
    return t, lon_arr, lat_arr


sharedDir = 'shared'
t, lon_arr, lat_arr = load_common(sharedDir)  # 经纬度只要存储一份就够了，都是共享的


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
    return distance / 1000  # 返回km为单位


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


def search(day1, day2, index1, indices, level_num, lon_set, lat_set, radius_set, flag=0):
    if day2 > up_bound:
        return

    tarDir1 = 'result/small' + str(day1)
    tarDir2 = 'result/small' + str(day2)

    uvel1, vvel1, vorticity1, OW1, OW_eddies1, eddie_census1, nEddies1, circulation_mask1, levels1 = load_pkl(tarDir1)
    uvel2, vvel2, vorticity2, OW2, OW_eddies2, eddie_census2, nEddies2, circulation_mask2, levels2 = load_pkl(tarDir2)
    eke1 = 0.5 * (uvel1 ** 2 + vvel1 ** 2)
    eke2 = 0.5 * (uvel2 ** 2 + vvel2 ** 2)

    '''
    dis, radius, vorticity, eke
    dis 需要经纬度
    radius 仅需index
    vorticity 需要经纬度下标
    eke需要经纬度下标
    '''

    # index1 = 2  # day1时间第几个涡旋
    lon1 = eddie_census1[2][index1]  # 涡核经度
    lat1 = eddie_census1[3][index1]  # 涡核纬度
    dia1 = eddie_census1[-1][index1]  # 涡旋直径
    level1 = levels1[index1]  # 涡旋层数
    lon_index1 = get_lon_index(lon_arr, lon1)  # 经度在数组中索引
    lat_index1 = get_lat_index(lat_arr, lat1)  # 纬度索引

    if flag == 1:  # 第一轮运行，需要把当天的添加进去；后面的就不用了，因为本天会添加下一天的
        level_num.append(level1)
        lon_set.append(lon1)
        lat_set.append(lat1)
        radius_set.append(dia1 / 2)

    next_index = -1
    next_radi = -1
    next_level = -1
    next_lon = -1
    next_lat = -1
    minDiff = 1e10

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
        delta_r = 0.5 * (dia1 - dia2)

        # 两个涡旋所有层数，涡度差绝对值的平均值
        temp = np.abs(vorticity1[lon_index1][lat_index1] - vorticity2[lon_index2][lat_index2])
        delta_xi = np.sum(temp) / len(temp)

        # 两个涡度所有层数，eke差绝对值的平均值
        temp = np.abs(eke1[lon_index1][lat_index1] - eke2[lon_index2][lat_index2])
        delta_eke = np.sum(temp) / len(temp) * 1e4

        print("距离差: ", delta_dis)
        print("半径差: ", delta_r)
        print("涡度差: ", delta_xi)
        print("eke差: ", delta_eke)
        print(w1 * (delta_dis / d0) ** 2, w2 * (delta_r / r0) ** 2, w3 * (delta_xi / xi0) ** 2,
              w4 * (delta_eke / eke0) ** 2)

        curD = sqrt(w1 * (delta_dis / d0) ** 2 + w2 * (delta_r / r0) ** 2 + w3 * (delta_xi / xi0) ** 2 + w4 * (
                delta_eke / eke0) ** 2)
        print("D between %d and %d is %f\n" % (index1, index2, curD))

        if curD < minDiff:  # 更新当前差异最小值
            minDiff = curD
            next_index = index2
            next_level = level2
            next_lon = lon2
            next_lat = lat2
            next_radi = dia2 / 2

    if minDiff < 1:
        indices.append(next_index)
        level_num.append(next_level)
        lon_set.append(next_lon)
        lat_set.append(next_lat)
        radius_set.append(next_radi)
        print("-----------------------------------\n")
        search(day2, day2 + 1, next_index,  indices, level_num, lon_set, lat_set, radius_set)
    else:  # # 如果最小值仍然超过阈值 说明没有合适的候选。没找到，就跳过这一天
        indices.append(-1)
        level_num.append(-1)
        lon_set.append(-1)
        lat_set.append(-1)
        radius_set.append(-1)
        print("-----------------------------------\n")
        search(day1, day2 + 1, index1,  indices, level_num, lon_set, lat_set, radius_set)


def write_json(tarDir, obj):
    # 首先读取已有的json文件中的内容
    item_list = []
    with open(os.path.join(tarDir, 'eddies.json'), "r") as f:
        try:
            load_dict = json.load(f)
            num_item = len(load_dict)
        except:
            num_item = 0
        for i in range(num_item):
            name = load_dict[i]['name']
            master = load_dict[i]['master']
            lon = load_dict[i]['lon']
            lat = load_dict[i]['lat']
            radius = load_dict[i]['radius']
            level = load_dict[i]['level']

            item_dict = {
                "name": name,
                "master": master,
                "lon": lon,
                "lat": lat,
                "radius": radius,
                "level": level,
            }
            item_list.append(item_dict)

    # 读取已有内容完毕
    # 将新传入的dict对象追加至list中
    item_list.append(obj)
    # 将追加的内容与原有内容写回（覆盖）原文件
    with open(os.path.join(tarDir, 'eddies.json'), 'w', encoding='utf-8') as f2:
        json.dump(item_list, f2, ensure_ascii=False)


# 对于 start_day _ start_index 的涡旋进行追踪，并保存涡旋信息到json
def track_eddy(start_day, start_index):
    # 初始化
    indices = []
    level_num = []
    lon_set = []  # 涡旋经度集合
    lat_set = []  # 涡旋纬度集合
    radius_set = []  # 涡旋半径集合
    x_pos = []  # 在paraview上的x坐标
    y_pos = []  # 在paraview上的y坐标
    z_pos = []  # 在paraview上的z坐标
    seedR = []  # paraview球的半径
    points = []  # 35层大概需要10万  14层4万

    # 把该日期前的位置补齐，即在此天之前没追踪到
    for i in range(start_day):
        indices.append(-1)
        level_num.append(-1)
        lon_set.append(-1)
        lat_set.append(-1)
        radius_set.append(-1)

    indices.append(start_index)
    # 开始追踪
    # （当前天，目标天，当前index，索引数组，层数数组，涡核经度数组，涡核纬度数组，涡旋半径数组，flag只有在第一轮时才为1）
    search(start_day, start_day + 1, start_index, indices, level_num, lon_set, lat_set, radius_set, 1)

    for i in range(len(indices)):
        if indices[i] == -1:
            x_pos.append(-1)
            y_pos.append(-1)
            z_pos.append(-1)
            seedR.append(-1)
            points.append(-1)
        else:
            # 原数据经纬度跨度都是20
            x_pos.append((lon_set[i] - 30.2072) / spanLon)
            y_pos.append((lat_set[i] - 10.0271) / spanLat)
            # 比如有40层，中心位置应该在13层左右， 然后球半径应该是26层
            z_pos.append(2 * level_num[i] / 50 / 3)  # 中心位置设置在2/3高度处（因为靠近底部才是第0层）
            seedR.append(level_num[i] / 50 / 3)  # 半径设置为1/3深度

            temp = ceil(level_num[i] * 2 / 7)
            if temp < 3:
                temp = 3

            points.append(temp * 10000)

    print("days:\n", days)  # 天数
    print("indices:\n", indices)  # 图上的第几个涡旋
    print("level_num:\n", level_num)  # 层数
    print("points:\n", points)  # 撒点数
    print("lon_set:\n", lon_set)  # 涡核经度集合
    print("lat_sat:\n", lat_set)  # 涡核纬度集合
    print("radius_set:\n", radius_set)  # 涡旋半径集合
    print("x_pos:\n", x_pos)
    print("y_pos:\n", y_pos)
    print("z_pos:\n", z_pos)
    print("seedR:\n", seedR)

    # print(len(days), len(indices), len(level_num), len(points), len(lon_set), len(lat_set), len(x_pos), len(y_pos))

    identifier = str(start_day) + '-' + str(start_index)

    # ------------------------------------生成paraview所需数据-------------------------------------------
    track_dict = {"days": days, "indices": indices, "points": points,
                  "x_pos": x_pos, "y_pos": y_pos, "z_pos": z_pos, "seedR": seedR}

    # 写入追踪字典数据，它不生成json数据！
    tarDir = 'track/'
    if not os.path.exists(tarDir):
        os.makedirs(tarDir)
    file = os.path.join(tarDir, identifier)
    np.save(file, track_dict)

    # ------------------------------------生成json格式 主涡旋 追踪数据-------------------------------------------
    # 这个是简单的涡旋追踪，是生成json后在js里加载的
    site_dict = {"days": days, "indices": indices}
    # 写入时间和索引json数据
    site_json = json.dumps(site_dict, sort_keys=False)
    f = open(os.path.join(tarDir, identifier + '_track.json'), 'w')
    f.write(site_json)

    # ------------------------------------更新json所有涡旋信息-------------------------------------------
    # 如果不存在，先创建个空的
    if not os.path.exists(os.path.join(tarDir, 'eddies.json')):
        f = open(os.path.join(tarDir, 'eddies.json'), 'w')
        f.close()

    for i in range(len(indices)):
        if indices[i] == -1:
            continue
        info_dict = {
            "name": str(days[i]) + "_" + str(indices[i]),
            "master": identifier,
            "lon": lon_set[i],
            "lat": lat_set[i],
            "radius": radius_set[i],
            "level": int(level_num[i]),
        }
        write_json(tarDir, info_dict)


'''
    【2】追踪
'''
if __name__ == '__main__':
    start_day = 0
    start_index = 9

    track_eddy(start_day, start_index)
