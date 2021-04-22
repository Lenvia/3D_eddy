% �����ݼ������������
clear all;
close all;
clc;
%% Parameters
dataFile = '/Users/yy/Downloads/resources_EA/COMBINED_2011013100.nc';


nbr = 15; % 9;
nu = 3; %5;  %������չ�����뾶
queueMaxElements = 125000;  % max_eddy_cells_search


%% Reading Data
longitude = ncread(dataFile, 'XC');
latitude = ncread(dataFile, 'YC');
depth = ncread(dataFile, 'Z_MIT40');
timeS = ncread(dataFile, 'T_AX');

%% Per Timestamp Processing

for timestamp = 1:1

    timestamp
    % reading data from main file
    startLoc = [1,1,1,timestamp];
    countLoc = [inf,inf,inf,1];
    
    
    % U(1,2,3,4)��ʾ��4�� lon[1],lat[2]λ�õ�3��
    U = ncread(dataFile, 'U', startLoc, countLoc);
    V = ncread(dataFile, 'V', startLoc, countLoc);
    eta = ncread(dataFile, 'ETA', startLoc(2:end), countLoc(2:end));
    

    
    [nx, ny, nz] = size(U);  % 500*500%50
    
    R = 6378e3;
    xx = zeros(nx, ny);  % xx(i,j)��ʾ lon[i], lat[j]λ�õ���0��0���ľ��Ⱦ���
    yy = zeros(nx, ny);
    
    for i=1:nx
        for j=1:ny
            xx(i,j) = 2.0*pi*R*cos(latitude(j)*pi/180.0)*longitude(i)/360.0;
            yy(i,j) = 2.0*pi*R*latitude(j)/360.0;
        end
    end
    [disx, disy, grid_area] = grid_cell_area(xx, yy);
    


    [du_dx, du_dy] = deriv1_central_diff_3D(U, xx, yy);
    [dv_dx, dv_dy] = deriv1_central_diff_3D(V, xx, yy);
    
    vorticity = dv_dx - du_dy;
    vv = vorticity(:,:,1);
    
    OW = (du_dx - dv_dy).^2 + (du_dy + dv_dx).^2 - vorticity.^2;
    
    
    % std�����׼��
    % std(A��flag��dim)
    sigma = std(OW(:,:,1),0,'all');
    
    %eddy centre detection
    OWcriticalPts = imregionalmin(OW(:,:,1));  % �������еľֲ���ֵ����⣬Ĭ�ϰ����򷨣���������һ����ֵ�߼�����

    
    surfVmag = ((U(:,:,1)).^2 + (V(:,:,1)).^2);
    surfVcriticalPts = imregionalmin(surfVmag);
    etaCriticalPts = imregionalmin(eta) + imregionalmax(eta);

    fil = ones(nbr);  % 15*15���˲�
    
    OWcriticalPts = nbrOperation(OWcriticalPts,fil);
    
    
    
    surfVcriticalPts = nbrOperation(surfVcriticalPts,fil);
    etaCriticalPts = nbrOperation(etaCriticalPts,fil);
    OWpoints = OW(:,:,1) < -0.2*sigma;  % OW���������ĵ�
    

    % .*�Ǿ����Ӧλ�����
    eddyCentres = ((OWcriticalPts .* surfVcriticalPts).* etaCriticalPts) .* OWpoints;
    % ���ؾ���X�з���Ԫ�ص��к��е�����ֵ������﷨���ڴ���ϡ�������������
    [row2,col2] = find(eddyCentres);  % ��ѡ��
    

    
    % Applying Geometric Constraints
    % ʹ�ü��η���һ��ɸѡ
    [m,n] = size(eddyCentres);
    count = size(row2);  % �������ĵĸ���
    row = row2;
    col = col2;
    count2 = 0;  % ɸѡ���к˸���
    for i = 1:count
        % Geometric Constraint 1
        signChange = 0;
        refVal = V(row2(i),col2(i),1);  % ����V
        % �����ĺ�������������������кˣ���㣩V��ŵģ�����signChange����ֹͣ������
        for x = max(row2(i)-nu,1):min(row2(i)+nu,m)  % nu�о����������뾶��ð���������ɵȼ������
            if(V(x,col2(i),1)*refVal < 0)
                signChange = 1;
                break;
            end
        end
        if signChange < 0.5  % ����ţ�ֱ�ӿ���һ����
            continue;
        end
        
        % �����е����ʾ����������V��ŵ� 
        
        % ��������������������������кˣ���㣩U��ŵģ�����signChange����ֹͣ������
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
        
        % �����е����ʾ����������U��ŵ�
        
        % ��άƽ������
        % Geometric Constraint 3
        signChange = 0;
%         refVal = gradVy(row2(i),col2(i),1) - gradUx(row2(i),col2(i),1);
        refVal = vorticity(row2(i), col2(i), 1);
        
        for x = max(row2(i)-nu,1):min(row2(i)+nu,m)
            for y = max(col2(i)-nu,1):min(col2(i)+nu,n)
%                 if (gradVy(x,y,1) - gradUx(x,y,1))*refVal < 0  % �ж�
                if vorticity(x,y,1)*refVal < 0  % �ж�
                    signChange = 1;
                    break;
                end
            end
        end
        if signChange > 0.5
            continue;
        end
        
        % �����е����ʾƽ������û������š�
        
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
    
    num = zeros(m,n,p);
    
    stack = zeros(queueMaxElements,3);
    stackPtr = 0;
    count = size(row);  % �к����ĸ���
    
    id = 0;
    
    flag =  0;
    for i = 1:count
        stackPtr = stackPtr + 1;
        stack(stackPtr,:) = [row(i),col(i),1];  % ��¼�ڱ�������
        % �Ե�ǰ����������BFS��ֱ���ﵽOW��ֵʱֹͣ
        minPos = zeros(1,1,1);
        minPos = stack(stackPtr,:);  % Ĭ��OWֵ��С�ĵط���ԭ��
        minOW_eddie = OW(minPos(1), minPos(2), minPos(3));  % ��ǰ����Ĭ����СOWֵ
        % fprintf('ԭʼ��')
        % [minPos,minOW_eddie]
        eddie_mask = zeros(m,n,p);  % �������ά�ģ����ڽ��circʱֻ�����ı��
        
        total_eke = 0;
        total_area = 0;
        vort = 0;
        
        if minPos(1)<170 & minPos(1)>125 & minPos(2)>380 & minPos(2)<450
            if minPos(1)== 129 || minPos(1) == 139
                flag = 1;
                [1111111111111111111111111111111111111111111111111111111111]
                [minPos(1), minPos(2), minPos(3)]
            end
        else
            flag = 0;
        end
        
        
        while(stackPtr > 0)
            x = stack(stackPtr,1);  % x������
            y = stack(stackPtr,2);
            z = stack(stackPtr,3);
            stackPtr = stackPtr - 1;  % ����
            % �Ա���к�Ϊ���ģ���άBFS�������������ĵ㶼ѹ��ջ
            for dx = max(x-1,1):min(x+1,m)
                for dy = max(y-1,1):min(y+1,n)
                    for dz = z:min(z+1,p)
                        % ����������δ��������δ��ѡ������OWֵ��������������ջ
                        % �᲻�ᵼ���ظ�����������ĳ�������������ĵ�(x1,y1,z1)��newData(x1,y1,z1)ʼ��Ϊ0
                        if newData(dx,dy,dz) < 0.5 & OW(dx,dy,dz) < -0.2*sigma
                            
                            if flag == 1 & x == 126 & y == 405
                                
                                [[x, y, z],[dx, dy, dz]]
                            end
                            
                            eddie_mask(dx, dy, dz) = 1;
                            newData(dx,dy,dz) = 1;
                            num(dx, dy, dz) = num(dx, dy, dz) + 1;
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
        if circ>0
            circ = 1;
        else
            circ = -1;
        end
        
        circulation_mask = circulation_mask + circ*eddie_mask(:,:,:);
        eke_mask = eke_mask + total_eke*eddie_mask(:,:,:);
        
        vort_mask = vort_mask + vorticity .* eddie_mask(:,:,:);
  
        
        
        
    end
    
end


load handel
