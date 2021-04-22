import pandas as pd
import plotly
import plotly.graph_objs as go
import joblib
import numpy as np
import netCDF4 as nc4

# filename0 = '../COMBINED_2011013100.nc'
# filename1 = '../ensemble1Eddies.nc'
# filename2 = '../3dAttr1.nc'
# filename3 = '../3dAttr2.nc'
#
#
# f = nc4.Dataset(filename2,'r', format='NETCDF4')  # 'r' stands for read
#
# circ = f.variables['circ'][:]
# circ = circ.transpose([3, 2, 1, 0])
#
#
# xupbound = 350
#
# data = np.zeros((xupbound, 500, 50))
#
#
# num = 60
# for day in range(num):
#     temp = circ[:xupbound, :, :, day]
#
#     # data = np.array((data, temp))
#     # data = data.max(axis=0)
#
#     data += temp
#
# print(data)
#
# data = data/num
# # data = data * 10000
#
# xdata = []
# ydata = []
# zdata = []
# value = []
#
# # minV = 999999999
# # maxV = 0
# for k in range(50):
#     print(k)
#     for i in range(xupbound):
#         for j in range(500):
#             # print(i, j, k, v)
#             v = data[i][j][k]
#             if v != 0:
#                 # minV = min(minV, v)
#                 # maxV = max(maxV, v)
#
#                 xdata.append(i)
#                 ydata.append(j)
#                 zdata.append(-k)
#                 value.append(v)
#                 print(i, j, k, v)
#
#
# joblib.dump(xdata, 'xdata_fre.pkl')
# joblib.dump(ydata, 'ydata_fre.pkl')
# joblib.dump(zdata, 'zdata_fre.pkl')
# joblib.dump(value, 'value_fre.pkl')

xdata = joblib.load('xdata_fre.pkl')
ydata = joblib.load('ydata_fre.pkl')
zdata = joblib.load('zdata_fre.pkl')
value = joblib.load('value_fre.pkl')

# minV = np.min(value)
# maxV = np.max(value)


print("赋值完毕")
xdata = np.array(xdata)
ydata = np.array(ydata)
zdata = np.array(zdata)

value = np.array(value)
# value = (value-minV)/(maxV-minV)  # 归一化
# value = value*100


print(value)

# xdata = xdata[np.where(abs(value)>0)]
# ydata = ydata[np.where(value>5)]
# zdata = zdata[np.where(value>5)]
# value = value[np.where(value>5)]




#Set marker properties
markercolor = value

#Make Plotly figure
fig1 = go.Scatter3d(x=xdata,
                    y=ydata,
                    z=zdata,
                    marker=dict(color=markercolor,
                                opacity=0.8,
                                reversescale=False,
                                colorscale='RdBu',
                                size=1,
                                cmax=1,
                                cmin=-1),
                    line=dict(width=0.02),
                    mode='markers')

#Make Plot.ly Layout
mylayout = go.Layout(scene=dict(xaxis=dict(title="lon"),
                                yaxis=dict(title="lat"),
                                zaxis=dict(title="depth", gridwidth=0.4)),)

#Plot and save html
plotly.offline.plot({"data": [fig1],
                     "layout": mylayout},

                     auto_open=False,
                     filename=("4DPlot_fre.html"))


