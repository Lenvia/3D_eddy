import os
import numpy as np
from collections import Counter
from pyecharts.charts import Bar
from pyecharts import options as opts
import json

tarDir = "../whole_attributes_txt_file"


def create(tarDir, day, attr):
    root = tarDir
    day = str(day)
    ident = attr+"_"+day

    name = ident+".txt"

    file = os.path.join(root, attr, name)

    data = np.around(np.loadtxt(file, dtype=float), 3)  # 保留n位小数
    data = data.flatten()

    c = Counter(data)

    maxN = c.most_common(2)[-1][-1]  # 除了0之外出现最高的数值频数

    sc = sorted(c.items(), key=lambda item: item[0])

    columns = []
    values = []

    for it in sc:
        if (-5 < it[0] < 5) and (it[0] != 0):
            columns.append(it[0])
            values.append(it[1])

    # 这个是简单的涡旋追踪，是生成json后在js里加载的
    dict = {"columns": columns, "values": values}
    # 写入时间和索引json数据
    dataJson = json.dumps(dict, sort_keys=False)

    echartsDir = '../echarts'
    echartsAttrDir = os.path.join(echartsDir, attr)
    if not os.path.exists(echartsAttrDir):
        os.mkdir(echartsAttrDir)

    f = open(os.path.join(echartsAttrDir, ident+'.json'), 'w')
    f.write(dataJson)