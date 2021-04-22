import json
import matplotlib.pyplot as plt
import numpy as np


with open('../result/features/features.json', 'r', encoding='utf8')as f:
    json_data = json.load(f)

info = json_data['info']
graph = json_data['forward']
graph2 = json_data['backward']


x1 = []
y1 = []
x2 = []
y2 = []

if __name__ == '__main__':
    # 0-2, 0-3, 0-5是大涡旋
    # for j in range(len(info[0])):
    #     print("0-"+str(j)+":", info[0][j])
    # print()

    for i in range(len(graph2)):  # 每一天
        for j in range(len(graph2[i])):  # 每个涡旋
            if info[i][j][0] < 350:
                # x, y, 直径（半径），极性，涡度， 动能
                if info[i][j][3] == 1:  # 气旋
                    x1.append(info[i][j][2])
                    y1.append(info[i][j][4])
                else:
                    x2.append(info[i][j][2])
                    y2.append(info[i][j][4])

    # plt.title(u'-相对涡度')

    plt.xlabel('Radius')
    plt.ylabel('vorticity')

    plt.legend()

    plt.scatter(x1, y1, s=10, c="#ff1212", marker='o')
    plt.scatter(x2, y2, s=10, c="#1212ff", marker='o')
    plt.show()
