% 单数据集多日涡旋检测
clear all;
close all;
clc;
%% Parameters
dataFile = '/Users/yy/Downloads/resources_EA/COMBINED_2011013100.nc';
newFileName = 'ensemble1Eddies.nc';
nbr = 15; % 9;
nu = 4; %5;  %像是扩展搜索半径
queueMaxElements = 125000;  % max_eddy_cells_search

%% New File Definition

% Open the file
ncid = netcdf.create(newFileName,'NC_WRITE');

% Define the dimensions
dimidt = netcdf.defDim(ncid,'time',60);
dimidlat = netcdf.defDim(ncid,'latitude',500);
dimidlon = netcdf.defDim(ncid,'longitude',500);
dimiddepth = netcdf.defDim(ncid,'depth',50);

% Define IDs for the dimension variables (pressure,time,latitude,...)
date_ID=netcdf.defVar(ncid,'time','double',[dimidt]);
latitude_ID=netcdf.defVar(ncid,'latitude','NC_FLOAT',[dimidlat]);
longitude_ID=netcdf.defVar(ncid,'longitude','NC_FLOAT',[dimidlon]);
depth_ID=netcdf.defVar(ncid,'depth','NC_FLOAT',[dimiddepth]);

% Define the main variable ()
isEddy_ID = netcdf.defVar(ncid,'isEddy','NC_BYTE',[dimidlon dimidlat dimiddepth dimidt]);

% We are done defining the NetCdf
netcdf.endDef(ncid);

%% Reading Data
longitude = ncread(dataFile, 'XC');
latitude = ncread(dataFile, 'YC');
depth = ncread(dataFile, 'Z_MIT40');
timeS = ncread(dataFile, 'T_AX');

%Then store the dimension variables in our new netCDF file
netcdf.putVar(ncid,date_ID,timeS);
netcdf.putVar(ncid,latitude_ID,latitude);
netcdf.putVar(ncid,longitude_ID,longitude);
netcdf.putVar(ncid,depth_ID,depth);

%% Per Timestamp Processing

for timestamp = 1:60
    % reading data from main file
    startLoc = [1,1,1,timestamp];
    countLoc = [inf,inf,inf,1];
    
    U = ncread(dataFile, 'U', startLoc, countLoc);
    V = ncread(dataFile, 'V', startLoc, countLoc);
    eta = ncread(dataFile, 'ETA', startLoc(2:end), countLoc(2:end));
    
    % processing data
    [gradUx, gradUy, ~] = gradient(U);
    [gradVx, gradVy, ~] = gradient(V);

    % OW值
    OW = (gradUy - gradVx).^2 + (gradVy + gradUx).^2 - (gradVy - gradUx).^2;
    
    % std计算标准差
    % std(A，flag，dim)
    sigma = std(OW(:,:,1),0,'all');
    
    %eddy centre detection
    OWcriticalPts = imregionalmin(OW(:,:,1));  % 矩阵行列的局部极值的求解，默认八邻域法，本例返回一个二值逻辑矩阵
    surfVmag = ((U(:,:,1)).^2 + (V(:,:,1)).^2);
    surfVcriticalPts = imregionalmin(surfVmag);
    etaCriticalPts = imregionalmin(eta) + imregionalmax(eta);

    fil = ones(nbr);  % 15*15的滤波
    
    OWcriticalPts = nbrOperation(OWcriticalPts,fil);
    surfVcriticalPts = nbrOperation(surfVcriticalPts,fil);
    etaCriticalPts = nbrOperation(etaCriticalPts,fil);
    OWpoints = OW(:,:,1) < -0.2*sigma;  % OW满足条件的点

    % .*是矩阵对应位置相乘
    eddyCentres = ((OWcriticalPts .* surfVcriticalPts).* etaCriticalPts) .* OWpoints;
    % 返回矩阵X中非零元素的行和列的索引值。这个语法对于处理稀疏矩阵尤其有用
    [row2,col2] = find(eddyCentres);  % 候选点
    
    % Applying Geometric Constraints
    % 使用几何法进一步筛选
    [m,n] = size(eddyCentres);
    count = size(row2);  % 涡旋中心的个数
    row = row2;
    col = col2;
    count2 = 0;  % 筛选后涡核个数
    for i = 1:count
        % Geometric Constraint 1
        signChange = 0;
        refVal = V(row2(i),col2(i),1);  % 表层的V
        % 从中心横向搜索，如果遇到和涡核（表层）V异号的，设置signChange，并停止搜索。
        for x = max(row2(i)-nu,1):min(row2(i)+nu,m)  % nu感觉像是搜索半径，冒号用来生成等间距序列
            if(V(x,col2(i),1)*refVal < 0)
                signChange = 1;
                break;
            end
        end
        if signChange < 0.5  % 不异号，直接看下一个点
            continue;
        end
        
        % 能运行到这表示存在与中心V异号的 
        
        % 从中心纵向搜索，如果遇到和涡核（表层）U异号的，设置signChange，并停止搜索。
        % Geometric Constraint 2
        signChange = 0;
        refVal = U(row2(i),col2(i),1);
        for y = max(col2(i)-nu,1):min(col2(i)+nu,n)
            if(U(row2(i),y,1)*refVal < 0)
                signChange = 1;
                break;
            end
        end
        if signChange < 0.5
            continue;
        end
        
        % 能运行到这表示存在与中心U异号的
        
        % 二维平面搜索
        % Geometric Constraint 3
        signChange = 0;
        refVal = gradVy(row2(i),col2(i),1) - gradUx(row2(i),col2(i),1);
        for x = max(row2(i)-nu,1):min(row2(i)+nu,m)
            for y = max(col2(i)-nu,1):min(col2(i)+nu,n)
                if (gradVy(x,y,1) - gradUx(x,y,1))*refVal < 0  % 剪切变形率异号
                    signChange = 1;
                    break;
                end
            end
        end
        if signChange > 0.5
            continue;
        end
        
        % 能运行到这表示平面搜索没出现异号。
        
        count2 = count2 + 1;
        row(count2) = row2(i);
        col(count2) = col2(i);
    end
    row = row(1:count2);
    col = col(1:count2);
    
    %BFS
    [m,n,p] = size(U);
    newData = zeros(m,n,p);
    stack = zeros(queueMaxElements,3);
    stackPtr = 0;
    count = size(row);  % 涡核中心个数
    for i = 1:count
        stackPtr = stackPtr + 1;
        stack(stackPtr,:) = [row(i),col(i),1];  % 记录在表层的坐标
        while(stackPtr > 0)
            x = stack(stackPtr,1);
            y = stack(stackPtr,2);
            z = stack(stackPtr,3);
            stackPtr = stackPtr - 1;  % 弹出
            % 以表层涡核为中心，三维BFS，把满足条件的点都压入栈
            for dx = max(x-1,1):min(x+1,m)
                for dy = max(y-1,1):min(y+1,n)
                    for dz = z:min(z+1,p)
                        % 如果这个坐标未被搜索或未入选，并且OW值满足条件，放入栈
                        %会不会导致重复搜索？对于某个不满足条件的点(x1,y1,z1)，newData(x1,y1,z1)始终为0
                        if newData(dx,dy,dz) < 0.5 & OW(dx,dy,dz) < -0.2*sigma
                            newData(dx,dy,dz) = 1;
                            stackPtr = stackPtr + 1;
                            stack(stackPtr,:) = [dx,dy,dz];
                        end
                    end
                end
            end
        end
    end
    newData = uint8(newData);
    
    %Inserting Data Into Main Variable
    startLoc = [0,0,0,timestamp-1];
    countLoc = [m,n,p,1];
    netcdf.putVar(ncid,isEddy_ID,startLoc,countLoc,newData);
end

%% Closing things
% We're done, close the netcdf
netcdf.close(ncid);
load handel
sound(y,Fs)