import datetime
import joblib
import sys
import numpy as np
from sympy import *
from math import radians, cos, sin, asin, sqrt, fabs, ceil, pi
import os
import json
import networkx as nx
import matplotlib.pyplot as plt
import scipy.io as scio

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

features = []
graph = []
graph2 = []

root = '../result/eddyInfo'

threshold = 0.3
showhold = 3

bound = 60


def load_common(tar_dir):
    t = joblib.load(tar_dir + '/t.pkl')
    lon_arr = joblib.load(tar_dir + '/lon.pkl')
    lat_arr = joblib.load(tar_dir + '/lat.pkl')
    return t, lon_arr, lat_arr


sharedDir = '../shared'
t, lon_arr, lat_arr = load_common(sharedDir)  # 经纬度只要存储一份就够了，都是共享的


# 计算两点间距离
def geodistance(lon1, lat1, lon2, lat2):
    # print("(%f, %f) (%f, %f)" % (lon1, lat1, lon2, lat2))
    # 这里用m

    lon1, lat1, lon2, lat2 = map(radians, [float(lon1), float(lat1), float(lon2), float(lat2)])  # 经纬度转换成弧度
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    distance = 2 * asin(sqrt(a)) * R  # 地球平均半径，6371km
    distance = round(distance, 3)
    return distance / 1000  # 返回km为单位


def wirte_features():
    for day in range(bound):
        auxf = []

        emptyList = []
        emptyList2 = []

        index = 0
        while true:
            name = str(day)+'-'+str(index)

            path = os.path.join(root, str(day), name)

            if os.path.exists(path):

                file = os.path.join(path, name+'.json')
                with open(file, 'r', encoding='utf8')as f:
                    json_data = json.load(f)
                    # print(json_data)

                    x = json_data['x']
                    y = json_data['y']
                    r = json_data['r']
                    circ = json_data['circ']
                    vort = json_data['vort']
                    eke = json_data['eke']
                    aveeke = json_data['aveeke']

                # frameFile = os.path.join(path, name+'.mat')
                # frame = scio.loadmat(frameFile)
                # frame = frame['eddie_mask']  # 三维数组

                k = 0
                # while k < frame.shape[2]:
                #     if np.max(frame[:, :, k]) > 0:
                #         k += 1
                #     else:
                #         break


                # 位置索引, 直径（半径），动能，深度, 涡度，极性，
                auxf.append([x, y, r, eke, aveeke, vort, circ])
                emptyList.append([])
                emptyList2.append([])

                index += 1

            else:
                break

        features.append(auxf)

        graph.append(emptyList)
        graph2.append(emptyList2)


def track():
    for i in range(len(graph)):  # len(graph)表示天数
        print("day:", i)
        temp = 0
        for j in range(len(graph[i])):  # len(graph[i])表示第i天涡旋的个数

            name1 = str(i)+'-'+str(j)

            # graph[i][j] 表示第i天第j个涡旋的延续数组
            flag = false
            # 还有下一天
            if i + 1 < len(graph):
                curr = np.array(features[i][j])

                for k in range(len(graph[i + 1])):  # 对于第i+1天的每个涡旋

                    name2 = str(i+1)+'-'+str(k)

                    nxt = np.array(features[i + 1][k])

                    curD = compute(name1, name2, curr, nxt)
                    if curD < threshold:
                        # print(str(i)+'-'+str(j), '->', str(i+1)+'-'+str(k))
                        graph[i][j].append(str(i+1) + '-' + str(k))
                        graph2[i+1][k].append(str(i) + '-' + str(j))  # 当前涡旋j是下一天涡旋k的前身

                        flag = true

                if len(graph[i][j]) == 0 and i+2 < len(graph):  # 没找到后继， 找下一天
                    for k in range(len(graph[i + 2])):  # 对于第i+2天的每个涡旋

                        name2 = str(i + 2) + '-' + str(k)
                        nxt = np.array(features[i + 2][k])

                        # if i == 0 and j == 5:
                        #     print("------------")

                        # 满足某些条件，可认为k是当前涡旋j的延续
                        curD = compute(name1, name2, curr, nxt)
                        # print(curD)
                        # print(str(i) + '-' + str(j), '->', str(i + 2) + '-' + str(k))
                        if curD < threshold:
                            # print(str(i)+'-'+str(j), '->', str(i+2)+'-'+str(k))
                            graph[i][j].append(str(i + 2) + '-' + str(k))
                            graph2[i+2][k].append(str(i) + '-' + str(j))  # 当前涡旋j是下一天涡旋k的前身

                            flag = true

                    # 还没有后继，继续找
                    if len(graph[i][j]) == 0 and i + 3 < len(graph):  # 没找到后继， 找下一天
                        for k in range(len(graph[i + 3])):  # 对于第i+3天的每个涡旋
                            name2 = str(i + 3) + '-' + str(k)

                            nxt = np.array(features[i + 3][k])


                            # 满足某些条件，可认为k是当前涡旋j的延续
                            curD = compute(name1, name2, curr, nxt)



                            if curD < threshold:
                                # print(str(i)+'-'+str(j), '->', str(i+3)+'-'+str(k))
                                graph[i][j].append(str(i + 3) + '-' + str(k))
                                graph2[i+3][k].append(str(i) + '-' + str(j))  # 当前涡旋j是下一天涡旋k的前身

                                flag = true

                        # 还没有后继，继续找
                        if len(graph[i][j]) == 0 and i + 4 < len(graph):  # 没找到后继， 找下一天
                            for k in range(len(graph[i + 4])):  # 对于第i+4天的每个涡旋

                                name2 = str(i + 4) + '-' + str(k)

                                nxt = np.array(features[i + 4][k])

                                # 满足某些条件，可认为k是当前涡旋j的延续
                                curD = compute(name1, name2, curr, nxt)

                                if curD < threshold:
                                    # print(str(i) + '-' + str(j), '->', str(i + 4) + '-' + str(k))
                                    graph[i][j].append(str(i + 4) + '-' + str(k))
                                    graph2[i + 4][k].append(str(i) + '-' + str(j))  # 当前涡旋j是下一天涡旋k的前身

                                    flag = true
            if flag:
                temp += 1

        # print(temp)


# 传来两个数组
def compute(name1, name2, curr, nxt):
    # 两个涡核的距离
    # print(curr, nxt)
    delta_dis = np.abs(geodistance(lon_arr[int(curr[0])], lat_arr[int(curr[1])], lon_arr[int(nxt[0])], lat_arr[int(nxt[1])]))
    # 两个涡旋半径差
    delta_r = np.abs(curr[2] - nxt[2])

    if delta_dis > 60:  # 相距太远直接return
        return 999999
    elif delta_dis > 15:  # 还是有点远，但不是没可能，等待补救
        curD = 999999

    # 涡度差
    delta_xi = np.abs(curr[5] - nxt[5])
    # eke差
    delta_eke = np.abs(curr[4] - nxt[4])*10000

    curD = sqrt(w1 * (delta_dis / d0) ** 2 + w2 * (delta_r / r0) ** 2)

    # curD = sqrt(w1 * (delta_dis / d0) ** 2 + w2 * (delta_r / r0) ** 2 + w4 * (delta_eke / eke0) ** 2)

    if curD > threshold:  # 补救方案
        # if delta_dis < 20:   # 可能有东西合并过来了导致半径突然增大？
        #     curD = 0
        if overlap(name1, name2):
            curD = 0

    # if curD < threshold:
    if name1 == '1-15' and name2 == '2-17':
        print("距离差: ", delta_dis, "差异：", w1 * (delta_dis / d0) ** 2)
        print("半径差: ", delta_r, "差异：", w2 * (delta_r / r0) ** 2)
        print("涡度差: ", delta_xi, "差异：", w3 * (delta_xi / xi0) ** 2)
        print("eke差: ", delta_eke, "差异：", w4 * (delta_eke / eke0) ** 2)

        print(curD)

    return curD


def overlap(name1, name2):
    day1 = name1.split('-')[0]
    day2 = name2.split('-')[0]
    path1 = os.path.join(root, str(day1), name1)
    path2 = os.path.join(root, str(day2), name2)

    frameFile1 = os.path.join(path1, name1+'.mat')
    frame1 = scio.loadmat(frameFile1)
    frame1 = frame1['eddie_mask'][:,:,0]  # 表层数组

    frameFile2 = os.path.join(path2, name2+'.mat')
    frame2 = scio.loadmat(frameFile2)
    frame2 = frame2['eddie_mask'][:,:,0]  # 表层数组

    area1 = np.sum(frame1 > 0)
    area2 = np.sum(frame2 > 0)
    over = np.sum(np.multiply(frame1, frame2) >0)

    ratio = 0.6

    if over > ratio*area1 or over > ratio*area2:
        print("--------------------------")
        print(name1, name2, area1, area2, over)
        return true
    else:
        return false


def plot():
    points_pos = {}
    nx_graph = nx.Graph()

    # 添加结点
    for i in range(len(graph)):
        for j in range(len(graph[i])):
            nx_graph.add_node(f'({i},{j})')
            points_pos[f'({i},{j})'] = (i, j)


    # 添加边
    for i in range(len(graph)):
        for j in range(len(graph[i])):
            for adj in graph[i][j]:  # 例如 '1-2'
                d = int(adj.split('-')[0])
                ind = int(adj.split('-')[1])

                name1 = f"({i},{j})"
                name2 = f"({d},{ind})"
                nx_graph.add_edge(name1, name2)



    fig = plt.figure(figsize=(12, 12))
    nx.draw(nx_graph, with_labels=True, pos=points_pos)
    plt.xlabel("Timestep")
    plt.show()

    # fig.savefig('eddy_life_cycle.png')


def save():
    '''
      生成涡旋json
    '''
    tarDir = '../result/features'
    if not os.path.exists(tarDir):
        os.makedirs(tarDir)
    # 这个是简单的涡旋追踪，是生成json后在js里加载的
    feature_dict = {"info": features, "forward": graph, "backward": graph2}
    # 写入时间和索引json数据
    feature_json = json.dumps(feature_dict, sort_keys=False)
    f = open(os.path.join(tarDir, 'features.json'), 'w')
    f.write(feature_json)


if __name__ == '__main__':
    wirte_features()

    # print(features)

    track()

    for g in graph:
        print(g)

    save()

    # plot()

