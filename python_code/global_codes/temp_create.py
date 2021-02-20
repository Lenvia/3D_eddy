from global_codes import create_dataJson as cdj

for day in range(0, 5):
    # cdj.create("../whole_attributes_txt_file", day, "OW")
    cdj.create("../whole_attributes_txt_file", day, "VORTICITY")
    cdj.create("../whole_attributes_txt_file", day, "SALT")
    cdj.create("../whole_attributes_txt_file", day, "TEMP")