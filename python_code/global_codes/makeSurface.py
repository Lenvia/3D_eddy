import os
import joblib
import numpy as np
import sys

np.set_printoptions(threshold=sys.maxsize)

dir = os.path.join("../whole_attributes_pkl_file", 'SALT')
salt = joblib.load(os.path.join(dir, 'SALT_0.pkl'))
# print(salt)


surface = salt.transpose((2, 0, 1))[0]

print(surface)
joblib.dump(surface, os.path.join('../whole_attributes_pkl_file/surface.pkl'))

surface = joblib.load('../whole_attributes_pkl_file/surface.pkl')
np.savetxt(os.path.join("../whole_attributes_txt_file", 'surface.txt'), surface)


# print(surface)