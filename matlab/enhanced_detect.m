% 单数据集多日涡旋检测
clear all;
close all;
clc;
%% Parameters
dataFile = '/Users/yy/Downloads/resources_EA/COMBINED_2011013100.nc';
newFileName = 'Eddies.nc';
attrFileName = '3dAttr1.nc';

nbr = 15; % 9;
nu = 3; %5;  %像是扩展搜索半径
queueMaxElements = 125000;  % max_eddy_cells_search

%% New File Definition

% Open the file
ncid = netcdf.create(newFileName,'NC_WRITE');
ncid2 = netcdf.create(attrFileName,'NC_WRITE');
% ncid3 = netcdf.create(attrFileName2,'NC_WRITE');

% Define the dimensions
dimidt = netcdf.defDim(ncid,'time',60);
dimidlat = netcdf.defDim(ncid,'latitude',500);
dimidlon = netcdf.defDim(ncid,'longitude',500);
dimiddepth = netcdf.defDim(ncid,'depth',50);

dimidt2 = netcdf.defDim(ncid2,'time',60);
dimidlat2 = netcdf.defDim(ncid2,'latitude',500);
dimidlon2 = netcdf.defDim(ncid2,'longitude',500);
dimiddepth2 = netcdf.defDim(ncid2,'depth',50);

% dimidt3 = netcdf.defDim(ncid3,'time',60);
% dimidlat3 = netcdf.defDim(ncid3,'latitude',500);
% dimidlon3 = netcdf.defDim(ncid3,'longitude',500);
% dimiddepth3 = netcdf.defDim(ncid3,'depth',50);

% Define IDs for the dimension variables (pressure,time,latitude,...)
date_ID=netcdf.defVar(ncid,'time','double',[dimidt]);
latitude_ID=netcdf.defVar(ncid,'latitude','NC_FLOAT',[dimidlat]);
longitude_ID=netcdf.defVar(ncid,'longitude','NC_FLOAT',[dimidlon]);
depth_ID=netcdf.defVar(ncid,'depth','NC_FLOAT',[dimiddepth]);

date_ID2=netcdf.defVar(ncid2,'time','double',[dimidt2]);
latitude_ID2=netcdf.defVar(ncid2,'latitude','NC_FLOAT',[dimidlat2]);
longitude_ID2=netcdf.defVar(ncid2,'longitude','NC_FLOAT',[dimidlon2]);
depth_ID2=netcdf.defVar(ncid2,'depth','NC_FLOAT',[dimiddepth2]);

% date_ID3=netcdf.defVar(ncid3,'time','double',[dimidt3]);
% latitude_ID3=netcdf.defVar(ncid3,'latitude','NC_FLOAT',[dimidlat3]);
% longitude_ID3=netcdf.defVar(ncid3,'longitude','NC_FLOAT',[dimidlon3]);
% depth_ID3=netcdf.defVar(ncid3,'depth','NC_FLOAT',[dimiddepth3]);


% Define the main variable ()
isEddy_ID = netcdf.defVar(ncid,'isEddy','NC_BYTE',[dimidlon dimidlat dimiddepth dimidt]);
circ_ID = netcdf.defVar(ncid2, 'circ', 'NC_SHORT', [dimidlon2 dimidlat2 dimiddepth2 dimidt2]);
eke_ID = netcdf.defVar(ncid2, 'eke', 'NC_DOUBLE', [dimidlon2 dimidlat2 dimiddepth2 dimidt2]);

% vort_ID = netcdf.defVar(ncid3, 'vort', 'NC_DOUBLE', [dimidlon3 dimidlat3 dimiddepth3 dimidt3]);

% We are done defining the NetCdf
netcdf.endDef(ncid);
netcdf.endDef(ncid2);
% netcdf.endDef(ncid3);

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

netcdf.putVar(ncid2,date_ID2,timeS);
netcdf.putVar(ncid2,latitude_ID2,latitude);
netcdf.putVar(ncid2,longitude_ID2,longitude);
netcdf.putVar(ncid2,depth_ID2,depth);

% netcdf.putVar(ncid3,date_ID3,timeS);
% netcdf.putVar(ncid3,latitude_ID3,latitude);
% netcdf.putVar(ncid3,longitude_ID3,longitude);
% netcdf.putVar(ncid3,depth_ID3,depth);

%% Per Timestamp Processing

for timestamp = 1:60
%     folderName = strcat('./result/eddyInfo/', num2str(timestamp-1));
%     mkdir(folderName);
    timestamp
    % reading data from main file
    startLoc = [1,1,1,timestamp];
    countLoc = [inf,inf,inf,1];
    
    
    % U(1,2,3,4)表示第4天 lon[1],lat[2]位置第3层
    U = ncread(dataFile, 'U', startLoc, countLoc);
    V = ncread(dataFile, 'V', startLoc, countLoc);
    eta = ncread(dataFile, 'ETA', startLoc(2:end), countLoc(2:end));
    
%     U1 = U(:,:,1);
%     imagesc(U1);
    
    [nx, ny, nz] = size(U);  % 500*500%50
    
    R = 6378e3;
    xx = zeros(nx, ny);  % xx(i,j)表示 lon[i], lat[j]位置到（0，0）的经度距离
    yy = zeros(nx, ny);
    
    for i=1:nx
        for j=1:ny
            xx(i,j) = 2.0*pi*R*cos(latitude(j)*pi/180.0)*longitude(i)/360.0;
            yy(i,j) = 2.0*pi*R*latitude(j)/360.0;
        end
    end
    [disx, disy, grid_area] = grid_cell_area(xx, yy);
    
%     aaaa = grid_area(301:500, 1:100);
    
    
    
    % processing data
%     [gradUx, gradUy, ~] = gradient(U);
%     [gradVx, gradVy, ~] = gradient(V);
% 
%     % OW值
%     OW = (gradUy - gradVx).^2 + (gradVy + gradUx).^2 - (gradVy - gradUx).^2;
%      
%     vorticity = (gradVy - gradUx);

    [du_dx, du_dy] = deriv1_central_diff_3D(U, xx, yy);
    [dv_dx, dv_dy] = deriv1_central_diff_3D(V, xx, yy);
    
    vorticity = dv_dx - du_dy;
    vv = vorticity(:,:,1);
    
    OW = (du_dx - dv_dy).^2 + (du_dy + dv_dx).^2 - vorticity.^2;
    
    
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
    
%     imagesc(eddyCentres);
    
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
%         refVal = gradVy(row2(i),col2(i),1) - gradUx(row2(i),col2(i),1);
        refVal = vorticity(row2(i), col2(i), 1);
        
        for x = max(row2(i)-nu,1):min(row2(i)+nu,m)
            for y = max(col2(i)-nu,1):min(col2(i)+nu,n)
%                 if (gradVy(x,y,1) - gradUx(x,y,1))*refVal < 0  % 涡度
                if vorticity(x,y,1)*refVal < 0  % 涡度
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
    circulation_mask = zeros(m,n,p);
    eke_mask = zeros(m,n,p);
    vort_mask = zeros(m,n,p);
    
    stack = zeros(queueMaxElements,3);
    stackPtr = 0;
    count = size(row);  % 涡核中心个数
    
    id = 0;
    for i = 1:count
        stackPtr = stackPtr + 1;
        stack(stackPtr,:) = [row(i),col(i),1];  % 记录在表层的坐标
        % 对当前涡旋从中心BFS，直到达到OW阈值时停止
        minPos = zeros(1,1,1);
        minPos = stack(stackPtr,:);  % 默认OW值最小的地方是原点
        minOW_eddie = OW(minPos(1), minPos(2), minPos(3));  % 当前区域默认最小OW值
        % fprintf('原始：')
        % [minPos,minOW_eddie]
        eddie_mask = zeros(m,n,p);  % 这个是三维的，但在结合circ时只用它的表层
        
        total_eke = 0;
        total_area = 0;
        vort = 0;
        
        while(stackPtr > 0)
            x = stack(stackPtr,1);  % x轴索引
            y = stack(stackPtr,2);
            z = stack(stackPtr,3);
            stackPtr = stackPtr - 1;  % 弹出
            % 以表层涡核为中心，三维BFS，把满足条件的点都压入栈
            for dx = max(x-1,1):min(x+1,m)
                for dy = max(y-1,1):min(y+1,n)
                    for dz = z:min(z+1,p)
                        % 如果这个坐标未被搜索或未入选，并且OW值满足条件，放入栈
                        % 会不会导致重复搜索？对于某个不满足条件的点(x1,y1,z1)，newData(x1,y1,z1)始终为0
                        if newData(dx,dy,dz) < 0.5 & OW(dx,dy,dz) < -0.2*sigma
                            eddie_mask(dx, dy, dz) = 1;
                            newData(dx,dy,dz) = 1;
                            stackPtr = stackPtr + 1;
                            stack(stackPtr,:) = [dx,dy,dz];
                            
                            total_eke = total_eke+0.5*(U(dx,dy,dz)^2 + V(dx,dy,dz)^2);
                            total_area = total_area+1;

                            vort = vort+vorticity(dx, dy, dz);
                        end
                    end
                end
            end
        end
        tarX = minPos(1); tarY = minPos(2); tarZ = minPos(3);
        circ_sides = -V(min(tarX+1,nx), tarY, tarZ)*disy(min(tarX+1,nx),tarY) - U(tarX, max(tarY-1,1), tarZ)*disx(tarX,max(1,tarY-1)) + V(max(1,tarX-1), tarY, tarZ)*disy(max(tarX-1,1),tarY) + U(tarX, min(tarY+1,ny), tarZ)*disx(tarX,min(tarY+1,ny));
        circ_corner1 = -V(min(tarX+1,nx), max(tarY-1,1), tarZ)*0.5*disy(min(tarX+1,nx),max(tarY-1,1)) - U(min(tarX+1,nx), max(tarY-1,1), tarZ)*0.5*disx(min(tarX+1,nx),max(tarY-1,1));
        circ_corner2 = -U(max(1,tarX-1), max(tarY-1,1), tarZ)*0.5*disx(max(1,tarX-1),max(tarY-1,1)) + V(max(1,tarX-1), max(tarY-1,1), tarZ)*0.5*disy(max(1,tarX-1),max(tarY-1,1));
        circ_corner3 =  V(max(1,tarX-1), min(tarY+1,ny), tarZ)*0.5*disy(max(1,tarX-1),min(tarY+1,ny)) + U(max(1,tarX-1), min(tarY+1,ny), tarZ)*0.5*disx(max(1,tarX-1),min(tarY+1,ny));
        circ_corner4 =  U(min(tarX+1,nx), min(tarY+1,ny), tarZ)*0.5*disx(min(tarX+1,nx),min(tarY+1,ny)) - V(min(tarX+1,nx), min(tarY+1,ny), tarZ)*0.5*disy(min(tarX+1,nx),min(tarY+1,ny));
        
        circ = circ_sides + circ_corner1 + circ_corner2 + circ_corner3 + circ_corner4;
        if circ<0
            circ = 1;  % 气旋
        else
            circ = -1; % 反气旋
        end
        
        circulation_mask = circulation_mask + circ*eddie_mask(:,:,:);
        eke_mask = eke_mask + total_eke*eddie_mask(:,:,:);
        
        vort_mask = vort_mask + vorticity .* eddie_mask(:,:,:);
        
        if total_area>1
            dirName = strcat('./result/eddyInfo/',num2str(timestamp-1),'/', num2str(timestamp-1),'-',num2str(id));
            mkdir(dirName);

            [srow, scol] = find(eddie_mask(:,:,1));
            surface_area = 0;

            for a = 1:size(srow)
               surface_area = surface_area + grid_area(srow(a), scol(a)); 
            end

            r = sqrt(surface_area/pi)/1e3;

            dict = struct();
            dict.x = row(i);
            dict.y = col(i);
            dict.area = surface_area;
            dict.r = r;
            dict.circ = circ;
            dict.eke = total_eke;
            dict.vort = vort/total_area;
            dict = jsonencode(dict)

            % 写入json
            json_name = strcat(num2str(timestamp-1),'-',num2str(id), '.json');

            file_name= strcat(dirName, '/', json_name)
            fid=fopen(file_name,'w');
            fprintf(fid, dict);
            sta=fclose(fid);

            % 保存形状数组
            mat_name = strcat(num2str(timestamp-1),'-',num2str(id), '.mat');
            mat_file_name = strcat(dirName, '/', mat_name);
            save(mat_file_name, 'eddie_mask');

            id= id+1;
         end
        
        
        
    end
    newData = uint8(newData);
    
    
    
    %Inserting Data Into Main Variable
    startLoc = [0,0,0,timestamp-1];
    countLoc = [m,n,p,1];
    
    startLoc2 = [0,0,timestamp-1];
    countLoc2 = [m,n,1];
    
    netcdf.putVar(ncid,isEddy_ID,startLoc,countLoc,newData);
    netcdf.putVar(ncid2, circ_ID, startLoc,countLoc, circulation_mask);
    netcdf.putVar(ncid2, eke_ID, startLoc,countLoc, eke_mask);
%     netcdf.putVar(ncid3, vort_ID, startLoc,countLoc, vort_mask);
end

%% Closing things
% We're done, close the netcdf
netcdf.close(ncid);
netcdf.close(ncid2);
% netcdf.close(ncid3);
load handel
% sound(y,Fs)