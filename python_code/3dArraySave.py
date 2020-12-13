import numpy as np

arr = np.random.rand(3, 2, 2)
print(arr)
# reshaping the array from 3D
# matrice to 2D matrice.
arr_reshaped = arr.reshape(arr.shape[0], -1)

print(arr_reshaped)

# saving reshaped array to file.
np.savetxt("geekfile.txt", arr_reshaped)

# retrieving data from file.
loaded_arr = np.loadtxt("geekfile.txt")

# This loadedArr is a 2D array, therefore
# we need to convert it to the original
# array shape.reshaping to get original
# matrice with original shape.
load_original_arr = loaded_arr.reshape(
    loaded_arr.shape[0], loaded_arr.shape[1] // arr.shape[2], arr.shape[2])

# check the shapes:
print("shape of arr: ", arr.shape)
print("shape of load_original_arr: ", load_original_arr.shape)

# check if both arrays are same or not:
if (load_original_arr == arr).all():
    print("Yes, both the arrays are same")
else:
    print("No, both the arrays are not same")