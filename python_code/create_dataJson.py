import os
import numpy as np
from collections import Counter
from pyecharts.charts import Bar
from pyecharts import options as opts

tarDir = "./whole_attributes_txt_file"
attr = "OW"
day = "0"
name = attr+"_"+day+".txt"

file = os.path.join(tarDir, attr, name)

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

bar = (
    Bar()
    .add_xaxis(columns)
    .add_yaxis("", values)
    .set_global_opts(title_opts=opts.TitleOpts(title="OW分布", subtitle="第"+day+"天", pos_left='center'))
    .set_global_opts(legend_opts=opts.LegendOpts(is_show=False))
    .set_global_opts(visualmap_opts=opts.VisualMapOpts(is_show=True, max_=maxN))
    .set_series_opts(label_opts=opts.LabelOpts(is_show=False))
)

bar.render(attr+"_"+day+".html")