import numpy as np
import os
from paraview.simple import *

rootDir = '/Users/yy/PycharmProjects/scivis2020'

vtk_arr = []
for i in range(5):
    vtkDir = os.path.join(rootDir, 'whole_vtk_file', 'vec' + str(i) + '.vtk')
    vtk_model = LegacyVTKReader(FileNames=[vtkDir])
    vtk_arr.append(vtk_model)


tarDir = os.path.join(rootDir, 'track/npy')


files = os.listdir(tarDir)
for file in files:
    identifier = file.split('.')[0]

    start_day = identifier.split('-')[0]
    strat_index = identifier.split('-')[1]

    file_name = identifier + '.npy'  # "4-13.npy"
    npyfile = os.path.join(tarDir, file_name)  # such as "/Users/yy/Desktop/track/npy/4-13.npy"

    print(npyfile)
    track_info = np.load(npyfile, allow_pickle=True)
    track_info = track_info.item()

    days = track_info["days"]
    indices = track_info["indices"]
    points = track_info["points"]
    x_pos = track_info["x_pos"]
    y_pos = track_info["y_pos"]
    xL = track_info["xL"]
    xR = track_info["xR"]
    yL = track_info["yL"]
    yR = track_info["yR"]

    for i in range(len(indices)):
        day = days[i]
        index = indices[i]
        name = str(day)+'_'+str(index)

        if index == -1:
            continue


        #### disable automatic camera reset on 'Show'
        paraview.simple._DisableFirstRenderCameraReset()

        # create a new 'Legacy VTK Reader'
        vtk_model = vtk_arr[day]

        # get active view
        renderView1 = GetActiveViewOrCreate('RenderView')
        # uncomment following to set a specific view size
        # renderView1.ViewSize = [2154, 1276]

        # show data in view
        vtkDisplay = Show(vtk_model, renderView1)

        # trace defaults for the display properties.
        vtkDisplay.Representation = 'Outline'
        vtkDisplay.ColorArrayName = [None, '']
        vtkDisplay.OSPRayScaleArray = 'vectors'
        vtkDisplay.OSPRayScaleFunction = 'PiecewiseFunction'
        vtkDisplay.SelectOrientationVectors = 'vectors'
        vtkDisplay.ScaleFactor = 0.09980000257492067
        vtkDisplay.SelectScaleArray = 'None'
        vtkDisplay.GlyphType = 'Arrow'
        vtkDisplay.GlyphTableIndexArray = 'None'
        vtkDisplay.GaussianRadius = 0.004990000128746033
        vtkDisplay.SetScaleArray = ['POINTS', 'vectors']
        vtkDisplay.ScaleTransferFunction = 'PiecewiseFunction'
        vtkDisplay.OpacityArray = ['POINTS', 'vectors']
        vtkDisplay.OpacityTransferFunction = 'PiecewiseFunction'
        vtkDisplay.DataAxesGrid = 'GridAxesRepresentation'
        vtkDisplay.SelectionCellLabelFontFile = ''
        vtkDisplay.SelectionPointLabelFontFile = ''
        vtkDisplay.PolarAxes = 'PolarAxesRepresentation'

        # init the 'GridAxesRepresentation' selected for 'DataAxesGrid'
        vtkDisplay.DataAxesGrid.XTitleFontFile = ''
        vtkDisplay.DataAxesGrid.YTitleFontFile = ''
        vtkDisplay.DataAxesGrid.ZTitleFontFile = ''
        vtkDisplay.DataAxesGrid.XLabelFontFile = ''
        vtkDisplay.DataAxesGrid.YLabelFontFile = ''
        vtkDisplay.DataAxesGrid.ZLabelFontFile = ''

        # init the 'PolarAxesRepresentation' selected for 'PolarAxes'
        vtkDisplay.PolarAxes.PolarAxisTitleFontFile = ''
        vtkDisplay.PolarAxes.PolarAxisLabelFontFile = ''
        vtkDisplay.PolarAxes.LastRadialAxisTextFontFile = ''
        vtkDisplay.PolarAxes.SecondaryRadialAxesTextFontFile = ''

        # reset view to fit data
        renderView1.ResetCamera()

        # get the material library
        materialLibrary1 = GetMaterialLibrary()

        # update the view to ensure updated data information
        renderView1.Update()

        # create a new 'Extract Subset'
        extractSubset1 = ExtractSubset(Input=vtk_model)

        # Properties modified on extractSubset1
        extractSubset1.VOI = [int(xL[i]), int(xR[i]), int(yL[i]), int(yR[i]), 0, 49]

        # show data in view
        extractSubset1Display = Show(extractSubset1, renderView1)

        # trace defaults for the display properties.
        extractSubset1Display.Representation = 'Outline'
        extractSubset1Display.ColorArrayName = [None, '']
        extractSubset1Display.OSPRayScaleArray = 'vectors'
        extractSubset1Display.OSPRayScaleFunction = 'PiecewiseFunction'
        extractSubset1Display.SelectOrientationVectors = 'vectors'
        extractSubset1Display.ScaleFactor = 0.09800000190734864
        extractSubset1Display.SelectScaleArray = 'None'
        extractSubset1Display.GlyphType = 'Arrow'
        extractSubset1Display.GlyphTableIndexArray = 'None'
        extractSubset1Display.GaussianRadius = 0.004900000095367432
        extractSubset1Display.SetScaleArray = ['POINTS', 'vectors']
        extractSubset1Display.ScaleTransferFunction = 'PiecewiseFunction'
        extractSubset1Display.OpacityArray = ['POINTS', 'vectors']
        extractSubset1Display.OpacityTransferFunction = 'PiecewiseFunction'
        extractSubset1Display.DataAxesGrid = 'GridAxesRepresentation'
        extractSubset1Display.PolarAxes = 'PolarAxesRepresentation'

        # update the view to ensure updated data information
        renderView1.Update()

        # create a new 'Stream Tracer'
        streamTracer1 = StreamTracer(Input=extractSubset1,
                                     SeedType='Point Source')

        # Properties modified on streamTracer1.SeedType
        streamTracer1.SeedType.Center = [x_pos[i], y_pos[i], 0.5]
        streamTracer1.SeedType.NumberOfPoints = int(points[i]*0.8)
        streamTracer1.SeedType.Radius = 0.5

        # Properties modified on streamTracer1
        streamTracer1.MinimumStepLength = 0.5

        # toggle 3D widget visibility (only when running from the GUI)
        Show3DWidgets(proxy=streamTracer1.SeedType)

        # show data in view
        streamTracer1Display = Show(streamTracer1, renderView1)

        # trace defaults for the display properties.
        streamTracer1Display.Representation = 'Surface'
        streamTracer1Display.ColorArrayName = [None, '']
        streamTracer1Display.OSPRayScaleArray = 'AngularVelocity'
        streamTracer1Display.OSPRayScaleFunction = 'PiecewiseFunction'
        streamTracer1Display.SelectOrientationVectors = 'Normals'
        streamTracer1Display.ScaleFactor = 0.06709547787904739
        streamTracer1Display.SelectScaleArray = 'AngularVelocity'
        streamTracer1Display.GlyphType = 'Arrow'
        streamTracer1Display.GlyphTableIndexArray = 'AngularVelocity'
        streamTracer1Display.GaussianRadius = 0.0033547738939523697
        streamTracer1Display.SetScaleArray = ['POINTS', 'AngularVelocity']
        streamTracer1Display.ScaleTransferFunction = 'PiecewiseFunction'
        streamTracer1Display.OpacityArray = ['POINTS', 'AngularVelocity']
        streamTracer1Display.OpacityTransferFunction = 'PiecewiseFunction'
        streamTracer1Display.DataAxesGrid = 'GridAxesRepresentation'
        streamTracer1Display.SelectionCellLabelFontFile = ''
        streamTracer1Display.SelectionPointLabelFontFile = ''
        streamTracer1Display.PolarAxes = 'PolarAxesRepresentation'

        # init the 'GridAxesRepresentation' selected for 'DataAxesGrid'
        streamTracer1Display.DataAxesGrid.XTitleFontFile = ''
        streamTracer1Display.DataAxesGrid.YTitleFontFile = ''
        streamTracer1Display.DataAxesGrid.ZTitleFontFile = ''
        streamTracer1Display.DataAxesGrid.XLabelFontFile = ''
        streamTracer1Display.DataAxesGrid.YLabelFontFile = ''
        streamTracer1Display.DataAxesGrid.ZLabelFontFile = ''

        # init the 'PolarAxesRepresentation' selected for 'PolarAxes'
        streamTracer1Display.PolarAxes.PolarAxisTitleFontFile = ''
        streamTracer1Display.PolarAxes.PolarAxisLabelFontFile = ''
        streamTracer1Display.PolarAxes.LastRadialAxisTextFontFile = ''
        streamTracer1Display.PolarAxes.SecondaryRadialAxesTextFontFile = ''

        # update the view to ensure updated data information
        renderView1.Update()

        # save data
        folder = os.path.join('/Users/yy/Desktop', 'vtk_folder', identifier)
        if not os.path.exists(folder):
            os.makedirs(folder)

        saveDir = os.path.join(folder, 'vtk'+str(day)+'_'+str(index)+'.vtk')
        SaveData(saveDir, proxy=streamTracer1, FileType='Ascii')

        #### saving camera placements for all active views

        # current camera placement for renderView1
        renderView1.CameraPosition = [-1.3159187086657036, -1.9938288594788491, 1.7189879798504963]
        renderView1.CameraFocalPoint = [0.49900001287460355, 0.4990000128746034, 0.49000000953674344]
        renderView1.CameraViewUp = [0.26188681764860167, 0.2666176334902895, 0.9275399356652659]
        renderView1.CameraParallelScale = 0.8591286487154975

        #### uncomment the following to render all views
        # RenderAllViews()
        # alternatively, if you want to write images, you can use SaveScreenshot(...).

        # destroy streamTracer1
        Delete(streamTracer1)
        del streamTracer1

        # destroy vec4_0_13vtk
        Delete(extractSubset1)
        del extractSubset1

        print(name+" finished!\n")





