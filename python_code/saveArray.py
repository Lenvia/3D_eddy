import numpy as np
import joblib
import os
import sys

day = 0

dir = os.path.join('result', 'small'+str(day))
OW = joblib.load(dir + '/OW.pkl')


# reshaping the array from 3D
# matrice to 2D matrice.
arr_reshaped = OW.reshape(OW.shape[0], -1)

tarDir = 'OW_array'
if not os.path.exists(tarDir):
    os.makedirs(tarDir)

# saving reshaped array to file.
np.savetxt(os.path.join(tarDir, "OW_"+str(day)+".txt"), arr_reshaped)

# # retrieving data from file.
# loaded_arr = np.loadtxt("OW_"+str(day)+".txt")
#
# # This loadedArr is a 2D array, therefore we need to convert it to the original
# # array shape.reshaping to get original matrice with original shape.
# load_original_arr = loaded_arr.reshape(
#     loaded_arr.shape[0], loaded_arr.shape[1] // OW.shape[2], OW.shape[2])
