import matplotlib.pyplot as plt
import joblib
import os
import sys
import datetime

day = sys.argv[1]
day = int(day)


## Change date format #############################################################
def julianh2gregorian(time_hours,origin):
    return origin + datetime.timedelta(hours=time_hours)


## Plot velocities and eddies #############################################################
def plot_eddies(day_julian_hours,lon,lat,uvel,vvel,vorticity,OW,OW_eddies,eddie_census,nEddies,intensity_mask,k_plot):
    fig = plt.figure(num=1, figsize=(5, 5))
    plt.imshow(OW_eddies[:,:,k_plot].T, extent=[lon[0],lon[-1],lat[0],lat[-1]], aspect='auto',origin="lower")

    # 去掉坐标轴和空白
    plt.axis('off')
    fig = plt.gcf()
    # fig.set_size_inches(7.0 / 3, 7.0 / 3)  # dpi = 300, output = 700*700 pixels
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    plt.subplots_adjust(top=1, bottom=0, right=1, left=0, hspace=0, wspace=0)
    plt.margins(0, 0)

    tarDir = '../2d_material'
    if not os.path.exists(tarDir):
        os.makedirs(tarDir)

    plt.savefig(os.path.join(tarDir, str(day) + '.png'), transparent=True, dpi=300, pad_inches=0)

    # plt.show()

    return plt


if __name__ == '__main__':
    k_plot = 0

    tarDir = os.path.join("../whole_result", str(day))

    # (f, lon, lat, depth, t) = load_netcdf4('COMBINED_2011013100.nc')
    sharedDir = '../shared'
    t = joblib.load(sharedDir + '/t.pkl')
    lon = joblib.load(sharedDir + '/lon.pkl')
    lat = joblib.load(sharedDir + '/lat.pkl')

    uvel = joblib.load(tarDir + '/uvel.pkl')
    vvel = joblib.load(tarDir + '/vvel.pkl')
    # print(vvel.shape)
    vorticity = joblib.load(tarDir + '/vorticity.pkl')
    OW = joblib.load(tarDir + '/OW.pkl')
    OW_eddies = joblib.load(tarDir + '/OW_eddies.pkl')
    eddie_census = joblib.load(tarDir + '/eddie_census.pkl')
    nEddies = joblib.load(tarDir + '/nEddies.pkl')
    circulation_mask = joblib.load(tarDir + '/circulation_mask.pkl')
    levels = joblib.load(tarDir + '/levels.pkl')

    plt = plot_eddies(t[day], lon, lat, uvel, vvel, vorticity, OW, OW_eddies, eddie_census, nEddies, circulation_mask,
                      k_plot)