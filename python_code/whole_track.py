import datetime
import joblib
import sys
import numpy as np
from sympy import *
from math import radians, cos, sin, asin, sqrt, fabs, ceil, pi
import os
import json

# 全局常量
R = 6371 * 1000  # 地球半径

d0 = 100  # km
r0 = 50  # km
xi0 = 1e-6  # s-1
eke0 = 100  # cm2 s-2

w1 = 1
w2 = 1
w3 = 1
w4 = 1

# 全局数据经纬度跨度
spanLon = 20
spanLat = 20
up_bound = 60

days = []
# 默认是60天
for i in range(60):
    days.append(i)

graph = []
graph2 = []
features = []

for day in range(0, 60):
    num = joblib.load("./whole_result/" + str(day) + "/nEddies.pkl")
    l = [[] for i in range(num)]  # len(centroid_list)表示当天涡旋个数
    graph.append(l)
    # 这里不能用graph2.append(l)，因为相同引用会导致graph2和graph一样而出错
    l2 = [[] for i in range(num)]  # len(centroid_list)表示当天涡旋个数
    graph2.append(l2)


def load_common(tar_dir):
    t = joblib.load(tar_dir + '/t.pkl')
    lon_arr = joblib.load(tar_dir + '/lon.pkl')
    lat_arr = joblib.load(tar_dir + '/lat.pkl')
    return t, lon_arr, lat_arr


sharedDir = 'shared'
t, lon_arr, lat_arr = load_common(sharedDir)  # 经纬度只要存储一份就够了，都是共享的


def load_pkl(tar_dir):
    nEddies = joblib.load(tar_dir + '/nEddies.pkl')
    eddie_census = joblib.load(tar_dir + '/eddie_census.pkl')
    vorts = joblib.load(tar_dir + '/vorts.pkl')
    ekes = joblib.load(tar_dir + '/ekes.pkl')

    return nEddies, eddie_census, vorts, ekes


# 计算两点间距离
def geodistance(lon1, lat1, lon2, lat2):
    print("(%f, %f) (%f, %f)" % (lon1, lat1, lon2, lat2))
    # 这里用m

    lon1, lat1, lon2, lat2 = map(radians, [float(lon1), float(lat1), float(lon2), float(lat2)])  # 经纬度转换成弧度
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    distance = 2 * asin(sqrt(a)) * R  # 地球平均半径，6371km
    distance = round(distance, 3)
    return distance / 1000  # 返回km为单位


def normalize_lon(lon):
    return (lon - 30.2072) / spanLon


def normalize_lat(lat):
    return (lat - 10.0271) / spanLat


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


def search(day1, day2, index1, indices, lon_set, lat_set, radius_set, flag=0):

    tarDir1 = 'whole_result/' + str(day1)
    tarDir2 = 'whole_result/' + str(day2)

    nEddies1, eddie_census1, vorts1, ekes1 = load_pkl(tarDir1)
    nEddies2, eddie_census2, vorts2, ekes2 = load_pkl(tarDir2)

    # index1 = 2  # day1时间第几个涡旋
    lon1 = eddie_census1[2][index1]  # 涡核经度
    lat1 = eddie_census1[3][index1]  # 涡核纬度
    dia1 = eddie_census1[-1][index1]  # 涡旋直径

    if flag == 1:  # 第一轮运行，需要把当天的添加进去；后面的就不用了，因为本天会添加下一天的
        lon_set.append(lon1)
        lat_set.append(lat1)
        radius_set.append(dia1 / 2)

    next_index = -1
    next_radi = -1
    next_lon = -1
    next_lat = -1
    minDiff = 1e10

    for index2 in range(nEddies2):  # 对于day2的所有涡旋
        print("day: %d, index2: %d" % (day2, index2))
        lon2 = eddie_census2[2][index2]  # 经度
        lat2 = eddie_census2[3][index2]  # 纬度
        dia2 = eddie_census2[-1][index2]  # 直径

        # 两个涡核的距离
        delta_dis = geodistance(lon1, lat1, lon2, lat2)
        # 两个涡旋半径差
        delta_r = 0.5 * (dia1 - dia2)

        # 涡度差
        delta_xi = np.abs(vorts1[index1] - vorts2[index2])

        # eke差
        delta_eke = np.abs(ekes1[index1] - ekes2[index2])

        # print("距离差: ", delta_dis)
        # print("半径差: ", delta_r)
        # print("涡度差: ", delta_xi)
        # print("eke差: ", delta_eke)
        # print(w1 * (delta_dis / d0) ** 2, w2 * (delta_r / r0) ** 2, w3 * (delta_xi / xi0) ** 2,
        #       w4 * (delta_eke / eke0) ** 2)

        curD = sqrt(w1 * (delta_dis / d0) ** 2 + w2 * (delta_r / r0) ** 2 + w3 * (delta_xi / xi0) ** 2 + w4 * (
                delta_eke / eke0) ** 2)
        print("D between %d and %d is %f\n" % (index1, index2, curD))

        if curD < minDiff:  # 更新当前差异最小值
            minDiff = curD
            next_index = index2
            next_lon = lon2
            next_lat = lat2
            next_radi = dia2 / 2

    if minDiff < 1:
        indices.append(next_index)
        lon_set.append(next_lon)
        lat_set.append(next_lat)
        radius_set.append(next_radi)
        # print("-----------------------------------\n")
        search(day2, day2 + 1, next_index, indices, lon_set, lat_set, radius_set)
    else:  # # 如果最小值仍然超过阈值 说明没有合适的候选。没找到，就跳过这一天
        indices.append(-1)
        lon_set.append(-1)
        lat_set.append(-1)
        radius_set.append(-1)
        # print("-----------------------------------\n")
        search(day1, day2 + 1, index1, indices, lon_set, lat_set, radius_set)


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

        # f2.close()


def wirte_features():
    for day in range(60):
        auxf = []
        # 写入features
        tarDir1 = 'whole_result/' + str(day)

        nEddies1, eddie_census1, vorts1, ekes1 = load_pkl(tarDir1)

        for i in range(nEddies1):  # 写入每个涡旋的属性
            # 位置索引, 直径（半径），极性，动能
            auxf.append([cx, cy, eddie_census1[i][5], eddie_census1[i][2], ekes1[i]])

        features.append(auxf)


# 对于 start_day _ start_index 的涡旋进行追踪，并保存涡旋信息到json
def track_eddy(start_day, start_index):
    # 初始化
    indices = []
    lon_set = []  # 涡旋经度集合
    lat_set = []  # 涡旋纬度集合
    radius_set = []  # 涡旋半径集合
    x_pos = []  # 在paraview上的x坐标
    y_pos = []  # 在paraview上的y坐标

    # 把该日期前的位置补齐，即在此天之前没追踪到
    for i in range(start_day):
        indices.append(-1)
        lon_set.append(-1)
        lat_set.append(-1)
        radius_set.append(-1)

    indices.append(start_index)
    # 开始追踪
    # （当前天，目标天，当前index，索引数组，涡核经度数组，涡核纬度数组，涡旋半径数组，flag只有在第一轮时才为1）
    search(start_day, start_day + 1, start_index, indices, lon_set, lat_set, radius_set, 1)

    for i in range(len(indices)):
        if indices[i] == -1:
            x_pos.append(-1)
            y_pos.append(-1)


        else:
            # 原数据经纬度跨度都是20
            x_pos.append(normalize_lon(lon_set[i]))
            y_pos.append(normalize_lat(lat_set[i]))


    print("days:\n", days)  # 天数
    print("indices:\n", indices)  # 图上的第几个涡旋
    print("lon_set:\n", lon_set)  # 涡核经度集合
    print("lat_sat:\n", lat_set)  # 涡核纬度集合
    print("radius_set:\n", radius_set)  # 涡旋半径集合
    print("x_pos:\n", x_pos)
    print("y_pos:\n", y_pos)

    identifier = str(start_day) + '-' + str(start_index)


    # ------------------------------------生成json格式 主涡旋 追踪数据-------------------------------------------
    # tarDir = 'track/json'
    # 这个是简单的涡旋追踪，是生成json后在js里加载的
    # site_dict = {"days": days, "indices": indices}
    # # 写入时间和索引json数据
    # site_json = json.dumps(site_dict, sort_keys=False)
    # f = open(os.path.join(tarDir, identifier + '_track.json'), 'w')
    # f.write(site_json)

    # ------------------------------------更新json所有涡旋信息-------------------------------------------
    # 如果不存在，先创建个空的
    # if not os.path.exists(os.path.join(tarDir, 'eddies.json')):
    #     f = open(os.path.join(tarDir, 'eddies.json'), 'w')
    #     f.close()
    #
    # for i in range(len(indices)):
    #     if indices[i] == -1:
    #         continue
    #     info_dict = {
    #         "name": str(days[i]) + "_" + str(indices[i]),
    #         "master": identifier,
    #         "lon": lon_set[i],
    #         "lat": lat_set[i],
    #         "radius": radius_set[i],
    #         "level": int(level_num[i]),
    #     }
    #     write_json(tarDir, info_dict)


'''
    【2】追踪
'''
if __name__ == '__main__':

    start_day = 0
    tarD = os.path.join('whole_result', str(start_day))
    num = len(joblib.load(os.path.join(tarD, 'levels.pkl')))
    cells = joblib.load(os.path.join(tarD, 'eddie_census.pkl'))[4][:num]

    # print(cells)
    # print(num)
    for start_index in range(num):
        if cells[start_index] > 1e2:
            track_eddy(start_day, start_index)
