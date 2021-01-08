import os
import joblib
import numpy as np
import sys

np.set_printoptions(threshold=sys.maxsize)

# dir = os.path.join("whole_attributes_pkl_file", 'SALT')
# salt = joblib.load(os.path.join(dir, 'SALT_0.pkl'))
# # print(salt)
#
#
# depth = np.array([[50] * 500 for i in range(500)])
#
# print(depth.shape)
#
# for i in range(500):
#     for j in range(500):
#         for k in range(50):
#             if salt[i][j][k] != 0:
#                 # print(i,j,k)
#                 depth[i][j] = k
#                 break
#
# # print(depth)
# joblib.dump(depth, os.path.join('whole_attributes_pkl_file/depth.pkl'))

depth = joblib.load('whole_attributes_pkl_file/depth.pkl')
# np.savetxt(os.path.join("whole_attributes_txt_file", 'depth.txt'), depth)

print(depth)