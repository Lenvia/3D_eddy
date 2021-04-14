import matplotlib.pyplot as plt
import math
import numpy as np
import scipy.signal as sg
import pandas as pd
import netCDF4 as nc4
import datetime
import joblib
import os
import sys
from sympy import *
from math import radians, cos, sin, asin, sqrt
import json

with open('../result/features/features.json', 'r', encoding='utf8')as f:
    json_data = json.load(f)

info = json_data['info']
graph = json_data['forward']
graph2 = json_data['backward']


def getEndDay(name):  # name: 'x-x'
    # print(name)
    d = int(name.split('-')[0])
    ind = int(name.split('-')[1])

    res = d

    # print("num:", len(graph[d][ind]))
    if len(graph[d][ind]) > 0:
        for name2 in graph[d][ind]:
            res = max(res, getEndDay(name2))
    else:  # 没有后继，返回自己所在的天数
        return res

    return res


if __name__ == '__main__':
    # 0-2, 0-3, 0-5是大涡旋
    for j in range(len(info[0])):
        print("0-"+str(j)+":", info[0][j])
    print()

    for i in range(len(graph2)):  # 每一天
        for j in range(len(graph2[i])):  # 每个涡旋
            if len(graph2[i][j]) == 0:  # 没有前驱，即新涡旋
                name = str(i)+'-'+str(j)
                print(name + "的寿命：" + str(getEndDay(name) - i + 1))

