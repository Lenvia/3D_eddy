import numpy as np
import joblib

# OW = joblib.load('../whole_attributes_pkl_file/OW/OW_0.pkl')
#
# cnt = 0
#
# for i in range(500):
#     for j in range(500):
#         for k in range(50):
#             if OW[i][j][k]<0:
#                 print(i,j,k, "  ---> ", OW[i][j][k])
#                 cnt += 1
#
# print("\n\n\n\n\n", cnt/(500*500*50), "\n\n\n\n\n\n")

a = np.array([1, 3, 4, 5])

a = a-1

print(a)