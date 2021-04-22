import pandas as pd
import plotly
import plotly.graph_objs as go
import joblib
import numpy as np
import netCDF4 as nc4

f = nc4.Dataset("../ensemble1Eddies.nc",'r', format='NETCDF4')  # 'r' stands for read
data = f.variables['isEddy'][:][0]
data = data.transpose([2, 1, 0])

data2 = joblib.load("../whole_attributes_pkl_file/TEMP/TEMP_0.pkl")

print(data.shape)
xdata = []
ydata = []
zdata = []
value = []

minV = 100
maxV = 0
for k in range(50):
    print(k)
    for i in range(500):
        for j in range(500):
            # print(i, j, k, v)
            if data[i][j][k] != 0:
                v = data2[i][j][k]
                if v != 0:
                    minV = min(minV, v)
                    maxV = max(maxV, v)

                    xdata.append(i)
                    ydata.append(j)
                    zdata.append(-k)
                    value.append(v)
                    # print(i, j, k, v)

joblib.dump(xdata, 'xdata.pkl')
joblib.dump(ydata, 'ydata.pkl')
joblib.dump(zdata, 'zdata.pkl')
joblib.dump(value, 'value.pkl')

# xdata = joblib.load('xdata.pkl')
# ydata = joblib.load('ydata.pkl')
# zdata = joblib.load('zdata.pkl')
# value = joblib.load('value.pkl')
minV = np.min(value)
maxV = np.max(value)

print(minV)
print(maxV)

print("赋值完毕")
value = np.array(value)
value = (value-minV)/(maxV-minV)
value = value*10

print(value)


#Set marker properties
markercolor = value

#Make Plotly figure
fig1 = go.Scatter3d(x=xdata,
                    y=ydata,
                    z=zdata,
                    marker=dict(color=markercolor,
                                opacity=1,
                                reversescale=True,
                                # colorscale='Blues',
                                size=3),
                    line=dict(width=0.02),
                    mode='markers')

#Make Plot.ly Layout
mylayout = go.Layout(scene=dict(xaxis=dict(title="lon"),
                                yaxis=dict(title="lat"),
                                zaxis=dict(title="depth")),)

#Plot and save html
plotly.offline.plot({"data": [fig1],
                     "layout": mylayout},
                     auto_open=False,
                     filename=("4DPlot.html"))


