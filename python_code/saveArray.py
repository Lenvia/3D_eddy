import numpy as np
import joblib
import os
import sys

day = 1

dir = os.path.join("whole_attributes_file", 'OW')
OW = joblib.load(os.path.join(dir, 'OW_'+str(day)+'.pkl'))


# reshaping the array from 3D
# matrice to 2D matrice.
arr_reshaped = OW.reshape(OW.shape[0], -1)

tarDir = 'OW_array'
if not os.path.exists(tarDir):
    os.makedirs(tarDir)


# saving reshaped array to file.
np.savetxt(os.path.join(tarDir, "OW_"+str(day)+".txt"), arr_reshaped)