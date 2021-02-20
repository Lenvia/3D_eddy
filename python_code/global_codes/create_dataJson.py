import os
import numpy as np
from collections import Counter
from pyecharts.charts import Bar
from pyecharts import options as opts
import json


def create(tarDir, day, attr):
    root = tarDir
    day = str(day)
    ident = attr + "_" + day

    name = ident + ".txt"

    file = os.path.join(root, attr, name)

    if attr == "OW":
        n = 3
    elif attr == "VORTICITY":
        n = 8
    elif attr == "SALT":
        n = 3
    else:  # "TEMP"
        n = 2

    data = np.around(np.loadtxt(file, dtype=float), n)  # 保留n位小数
    data = data.flatten()

    c = Counter(data)

    maxN = c.most_common(2)[-1][-1]  # 除了0之外出现最高的数值频数

    sc = sorted(c.items(), key=lambda item: item[0])

    # print(sc)

    columns = []
    values = []

    for it in sc:
        if attr == "OW":
            up = 5
            down = -5
        elif attr == "VORTICITY":
            up = 1
            down = -1
        elif attr == "SALT":
            up = 1e10
            down = 0
        else:
            up = 100
            down = 0

        if (down < it[0] < up) and (it[0] != 0):
            columns.append(it[0])
            values.append(it[1])

    # 这个是简单的涡旋追踪，是生成json后在js里加载的
    dict = {"columns": columns, "values": values}

    print(dict)
    # 写入时间和索引json数据
    dataJson = json.dumps(dict, sort_keys=False)

    echartsDir = '../echarts'
    echartsAttrDir = os.path.join(echartsDir, attr)
    if not os.path.exists(echartsAttrDir):
        os.mkdir(echartsAttrDir)

    f = open(os.path.join(echartsAttrDir, ident+'.json'), 'w')
    f.write(dataJson)

    # bar = (
    #     Bar()
    #     .add_xaxis(columns)
    #     .add_yaxis("", values)
    #     .set_global_opts(title_opts=opts.TitleOpts(title="分布", subtitle="第" + day + "天", pos_left='center'))
    #     .set_global_opts(legend_opts=opts.LegendOpts(is_show=False))
    #     .set_global_opts(visualmap_opts=opts.VisualMapOpts(is_show=True, max_=maxN))
    #     .set_series_opts(label_opts=opts.LabelOpts(is_show=False))
    # )
    # bar.render(attr + "_" + day + ".html")


# if __name__ == '__main__':
#     tdir = "./whole_attributes_txt_file"
#     create(tdir, 0, "TEMP")
#
#     # print('***获取当前目录***')  # 当前目录竟然在主目录下，可能是因为作为了module？？
#     # print(os.getcwd())
