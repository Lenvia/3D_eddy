import numpy as np
import joblib
import os
import sys
import json

attribute = 'OW'

for day in range(2, 5):
    # dir = os.path.join("../whole_attributes_pkl_file", attribute)
    # OW = joblib.load(os.path.join(dir, attribute+'_'+str(day)+'.pkl'))

    dir = os.path.join("../whole_result/", str(day))
    OW = joblib.load(os.path.join(dir, 'OW.pkl'))

    # reshaping the array from 3D
    # matrice to 2D matrice.
    arr_reshaped = OW.reshape(OW.shape[0], -1)

    tarDir = os.path.join("../whole_attributes_txt_file", attribute)
    if not os.path.exists(tarDir):
        os.makedirs(tarDir)


    # saving reshaped array to file.
    np.savetxt(os.path.join(tarDir, attribute+"_"+str(day)+".txt"), arr_reshaped)

