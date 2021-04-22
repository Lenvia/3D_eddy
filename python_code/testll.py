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


def load_netcdf4(filename):  # name of the netCDF data file
    f = nc4.Dataset(filename,'r', format='NETCDF4')  # 'r' stands for read

    # 根据本数据内容提取
    lon = f.variables['XC'][336:]  # 经度
    lat = f.variables['YC'][:132]  # 纬度
    depth = f.variables['Z_MIT40'][:]  # 层数
    # Load zonal and meridional veslocity, in m/s
    uvel = f.variables['U'][0, 0, :50, 336:]  # 纬向速度
    vvel = f.variables['V'][0, 0, :50, 336:]  # 经线速度

    return uvel


if __name__ == '__main__':
    uvel = load_netcdf4('COMBINED_2011013100.nc')

    uvel = uvel.transpose((1, 0))
    print(uvel.shape)
    print(uvel)