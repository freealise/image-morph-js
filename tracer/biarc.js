            
/******************************************************************************
  Copyright (c) 2014 Ryan Juckett
  http://www.ryanjuckett.com/

  This software is provided 'as-is', without any express or implied
  warranty. In no event will the authors be held liable for any damages
  arising from the use of this software.

  Permission is granted to anyone to use this software for any purpose,
  including commercial applications, and to alter it and redistribute it
  freely, subject to the following restrictions:

  1. The origin of this software must not be misrepresented; you must not
     claim that you wrote the original software. If you use this software
     in a product, an acknowledgment in the product documentation would be
     appreciated but is not required.

  2. Altered source versions must be plainly marked as such, and must not be
     misrepresented as being the original software.

  3. This notice may not be removed or altered from any source
     distribution.
******************************************************************************/

            // https://www.ryanjuckett.com/biarc-interpolation/
            // https://en.wikipedia.org/wiki/Geometric_design_of_roads


            // enums
            var SelectedEnum = Object.freeze(
            {
            None: 0,
            Point1: 1,
            Point2: 2,
            Tangent1: 3,
            Tangent2: 4
            });

            // types
            function Vec2(x, y)
            {
            this.x = x;
            this.y = y;
            }

            // math constants
            var c_Radians_Per_Degree = Math.PI / 180.0;
            var c_Degrees_Per_Radian = 180.0 / Math.PI;
            var c_Epsilon = 0.0001;

            // render constants
            var c_Point_Radius = 4;
            var c_Tangent_Length = c_Point_Radius * 3;
            var c_Tangent_Max = 36;

            // state
            var g_selection = SelectedEnum.None;

            // math functions
            function Sqr(val)             { return val*val; }
            function IsEqualEps(lhs, rhs) { return Math.abs(lhs - rhs) <= c_Epsilon; }

            function ToNumber_Safe(input)
            {
            var output = Number(input);
            return isNaN(output) ? 0 : output;
            }

            function Vec2_Add(lhs, rhs) { return new Vec2(lhs.x + rhs.x, lhs.y + rhs.y); }
            function Vec2_Sub(lhs, rhs) { return new Vec2(lhs.x - rhs.x, lhs.y - rhs.y); }
            function Vec2_Scale(lhs, scale) { return new Vec2(lhs.x*scale, lhs.y*scale); }
            function Vec2_AddScaled(lhs, rhs, scale) { return new Vec2(lhs.x + rhs.x*scale, lhs.y + rhs.y*scale); }

            function Vec2_Dot(lhs, rhs) { return lhs.x*rhs.x + lhs.y*rhs.y; }
            function Vec2_MagSqr(val)   { return val.x*val.x + val.y*val.y; }
            function Vec2_Mag(val)      { return Math.sqrt(val.x*val.x + val.y*val.y); }

            function Vec2_Normalize(val)
            {
            var mag = Vec2_Mag(val);
            return (mag > c_Epsilon) ? Vec2_Scale(val, 1.0/mag) : val;
            }

            function PointInCircle(point, center, radius)
            {
            return Vec2_MagSqr( Vec2_Sub(point,center) ) <= Sqr(radius);
            }

            // render functions
            function DrawLine(context, p1, p2, width, color)
            {
            context.beginPath();
            context.moveTo(p1.x, p1.y);
            context.lineTo(p2.x, p2.y);
            context.lineWidth = width;
            context.strokeStyle = color;
            context.stroke();
            }

            function DrawCircle(context, center, radius, color)
            {
            context.beginPath();
            context.arc(center.x, center.y, radius, 0, 2 * Math.PI, false);
            context.lineWidth = 0.25;
            context.strokeStyle = color;
            context.stroke();
            }

            function DrawArc(context, center, radius, startAng, endAng, width, color, positiveRotation)
            {
            context.beginPath();
            context.arc(center.x, center.y, radius, startAng, endAng, positiveRotation);
            context.lineWidth = width;
            context.strokeStyle = color;
            context.stroke();
            }

            function DrawArcFromEdge(context, p1, t1, p2, arcWidth, color, fromP1)
            {
            var chord = Vec2_Sub(p2, p1);
            var n1 = new Vec2(-t1.y, t1.x);
            var chordDotN1 = Vec2_Dot(chord, n1);

            if (IsEqualEps(chordDotN1,0))
            {
                // straight line
                DrawLine(context, p1, p2, arcWidth, color);
                if (fromP1 === true ) {
                  svg += "L " + p2.x.toFixed(2) + " " + p2.y.toFixed(2) + " ";
                } else {
                  svg += "L " + p1.x.toFixed(2) + " " + p1.y.toFixed(2) + " ";
                }
            }
            else
            {
                var radius = Vec2_MagSqr(chord) / (2*chordDotN1);
                var center = Vec2_AddScaled(p1, n1, radius);
                
                var p1Offset = Vec2_Sub(p1, center);
                var p2Offset = Vec2_Sub(p2, center);
                
                var p1Ang1 = Math.atan2(p1Offset.y,p1Offset.x);
                var p2Ang1 = Math.atan2(p2Offset.y,p2Offset.x);
                if ( p1Offset.x*t1.y - p1Offset.y*t1.x > 0) {
                        DrawArc(context, center, Math.abs(radius), p1Ang1, p2Ang1, arcWidth, color, !fromP1);

                } else {
                        DrawArc(context, center, Math.abs(radius), p1Ang1, p2Ang1, arcWidth, color, fromP1);
                }
                        
                context.globalAlpha = 0.05;
                DrawCircle(context, center, Math.abs(radius), color);
                context.globalAlpha = 1.0;

                radius = Math.abs(radius).toFixed(2);

                if (fromP1 === true ) {
                  if (chordDotN1>0) {
                    var cw = 1;
                  } else {
                    var cw = 0;
                  }
                  svg += "A " + radius + " " + radius + " 0 0 " + cw + " " + p2.x.toFixed(2) + " " + p2.y.toFixed(2) + " ";
                } else {
                  if (chordDotN1>0) {
                    var cw = 1;
                  } else {
                    var cw = 0;
                  }
                  svg += "A " + radius + " " + radius + " 0 0 " + cw + " " + p1.x.toFixed(2) + " " + p1.y.toFixed(2) + " ";
                }
            }
            }

            // get the splint points
            function GetPoint1()
            {
            return new Vec2(        ToNumber_Safe(document.getElementById('point1_x').value),
                                                ToNumber_Safe(document.getElementById('point1_y').value) );
            }

            function GetPoint2()
            {
            return new Vec2(        ToNumber_Safe(document.getElementById('point2_x').value),
                                                ToNumber_Safe(document.getElementById('point2_y').value) );
            }

            // choose the item at the given position
            function ChooseSelection(position)
            {
            for (var i=0; i<data.length-1; i++) {
              document.getElementById('point1_x').value = data[i][0];
              document.getElementById('point2_x').value = data[i+1][0];
              document.getElementById('point1_y').value = data[i][1];
              document.getElementById('point2_y').value = data[i+1][1];

              document.getElementById('tangent1').value = data[i][2];
              document.getElementById('tangent2').value = data[i+1][2];
              num = i;

              var point1 = GetPoint1();
              var point2 = GetPoint2();

              if ( PointInCircle( position, point1, c_Point_Radius ) ) {
                tg = false;
                return SelectedEnum.Point1;
              } else if ( PointInCircle( position, point2, c_Point_Radius ) ) {
                tg = false;
                return SelectedEnum.Point2;
              } else if ( PointInCircle( position, point1, c_Tangent_Length ) ) {
                tg = true;
                return SelectedEnum.Tangent1;
              } else if ( PointInCircle( position, point2, c_Tangent_Length ) ) {
                tg = true;
                return SelectedEnum.Tangent2;
              }
            }
                
            return SelectedEnum.None;
            }

            // move thet selected item to a given position
            function MoveSelection(position, cl)
            {
              document.getElementById('point1_x').value = data[num][0];
              document.getElementById('point2_x').value = data[num+1][0];
              document.getElementById('point1_y').value = data[num][1];
              document.getElementById('point2_y').value = data[num+1][1];

              document.getElementById('tangent1').value = data[num][2];
              document.getElementById('tangent2').value = data[num+1][2];

            switch (g_selection)
            {
            case SelectedEnum.Point1:
                data[num][0] = position.x;
                data[num][1] = position.y;
                document.getElementById('point1_x').value = position.x;
                document.getElementById('point1_y').value = position.y;
                break;
            case SelectedEnum.Point2:
                data[num+1][0] = position.x;
                data[num+1][1] = position.y;
                document.getElementById('point2_x').value = position.x;
                document.getElementById('point2_y').value = position.y;
                break;
            case SelectedEnum.Tangent1:
                var pointRelPos = Vec2_Sub(position, GetPoint1());
                data[num][2] = c_Degrees_Per_Radian * Math.atan2(pointRelPos.y,pointRelPos.x);
                
                if (document.getElementById('custom_d1').value != 1) {
                  data[num][3] = parseInt(document.getElementById('custom_d1').value);
                } else {data[num][3] = Vec2_Mag(pointRelPos);}

                document.getElementById('tangent1').value = c_Degrees_Per_Radian * Math.atan2(pointRelPos.y,pointRelPos.x);
                break;
            case SelectedEnum.Tangent2:
                var pointRelPos = Vec2_Sub(position, GetPoint2());
                data[num+1][2] = c_Degrees_Per_Radian * Math.atan2(pointRelPos.y,pointRelPos.x);
                
                if (document.getElementById('custom_d1').value != 1) {
                  data[num+1][3] = parseInt(document.getElementById('custom_d1').value);
                } else {data[num+1][3] = Vec2_Mag(pointRelPos);}

                document.getElementById('tangent2').value = c_Degrees_Per_Radian * Math.atan2(pointRelPos.y,pointRelPos.x);
                break;
            }
            }

            // input functions
            function Canvas_OnWheel(event)
            {
            var canvas = document.getElementById('splineCanvas');
            var rect = canvas.getBoundingClientRect();

            var mousePos = new Vec2( event.clientX - rect.left, event.clientY - rect.top );

            // choose the selected item
            RenderSpline();
            }

            function Canvas_OnClick(event)
            {
            var canvas = document.getElementById('splineCanvas');
            var rect = canvas.getBoundingClientRect();

            var mousePos = new Vec2( event.clientX - rect.left, event.clientY - rect.top );

            // choose the selected item
            g_selection = ChooseSelection( mousePos );
            RenderSpline();
            }

            function Canvas_OnMouseDown(event)
            {
            var canvas = document.getElementById('splineCanvas');
            var rect = canvas.getBoundingClientRect();

            var mousePos = new Vec2( event.clientX - rect.left, event.clientY - rect.top );

            // choose the selected item
            g_selection = ChooseSelection( mousePos );
            RenderSpline();
            }

            function Canvas_OnMouseMove(event)
            {
            if (g_selection != SelectedEnum.None)
            {
                var canvas = document.getElementById('splineCanvas');
                var rect = canvas.getBoundingClientRect();

                var mousePos = new Vec2( event.clientX - rect.left, event.clientY - rect.top );
                MoveSelection(mousePos);        
                RenderSpline();
            }
            }

            function Canvas_OnMouseUp(event)
            {
            if (g_selection != SelectedEnum.None)
            {
                var canvas = document.getElementById('splineCanvas');
                var rect = canvas.getBoundingClientRect();

                var mousePos = new Vec2( event.clientX - rect.left, event.clientY - rect.top );
                RenderSpline();
                
                g_selection = SelectedEnum.None;
            }
            }

            var set_tangents = document.getElementById("set_tangents");
            set_tangents.addEventListener('change', () => {

            RenderSpline();
            });
            
            var use_custom_d1 = document.getElementById("use_custom_d1");
            use_custom_d1.addEventListener('change', () => {

            RenderSpline();
            });


            document.getElementById("point1_x").addEventListener('change', () => { RenderSpline(); });
            document.getElementById("point1_y").addEventListener('change', () => { RenderSpline(); });
            document.getElementById("tangent1").addEventListener('change', () => { RenderSpline(); });
            document.getElementById("point2_x").addEventListener('change', () => { RenderSpline(); });
            document.getElementById("point2_y").addEventListener('change', () => { RenderSpline(); });
            document.getElementById("tangent2").addEventListener('change', () => { RenderSpline(); });


            function InitSpline()
            {
            var canvas = document.getElementById('splineCanvas');
            canvas.addEventListener('click', Canvas_OnClick, false);
            canvas.addEventListener('contextmenu', Canvas_OnClick, false);
            canvas.addEventListener('pointerdown', Canvas_OnMouseDown, false);
            canvas.addEventListener('pointermove', Canvas_OnMouseMove, false);
            canvas.addEventListener('pointerup', Canvas_OnMouseUp, false);
            canvas.addEventListener('pointerout', Canvas_OnMouseUp, false);
            canvas.addEventListener('wheel', Canvas_OnWheel, false);
            }

            function RenderSpline()
            {
            if (!document.getElementById('set_tangents').checked) {
                 setTangents();
            }
            if (!document.getElementById('use_custom_d1').checked) {
                 setDistances();
            }
            svg = "";

            // render style
            var boundsWidth = 0.5;
            var boundsColor = '#CCCCCC';

            var arcWidth = 1;
            var arcColor1 = '#FF0000';
            var arcColor2 = '#0000FF';

            var tangentWidth = 0.5;

            var pointColor1 = '#AA0000';
            var pointColor2 = '#0000AA';
            var connectColor = '#AA00AA';

            // get canvas
            var canvas = document.getElementById('splineCanvas');
            var context = canvas.getContext('2d');
            var canvasWidth = canvas.width;
            var canvasHeight = canvas.height;

            // clear
            context.clearRect(0, 0, canvas.width, canvas.height);

            for (var i=0; i<data.length-1; i++) {
              document.getElementById('point1_x').value = data[i][0];
              document.getElementById('point2_x').value = data[i+1][0];
              document.getElementById('point1_y').value = data[i][1];
              document.getElementById('point2_y').value = data[i+1][1];

              document.getElementById('tangent1').value = data[i][2];
              document.getElementById('tangent2').value = data[i+1][2];

            // get inputs
            var p1 = GetPoint1();
            var p2 = GetPoint2();

            if (i==0) {
              svg += "M " + p1.x.toFixed(2) + " " + p1.y.toFixed(2) + " ";
            }

            var angle1 = c_Radians_Per_Degree * ToNumber_Safe(document.getElementById('tangent1').value);
            var angle2 = c_Radians_Per_Degree * ToNumber_Safe(document.getElementById('tangent2').value);

            var t1 = new Vec2( Math.cos(angle1), Math.sin(angle1) );
            var t2 = new Vec2( Math.cos(angle2), Math.sin(angle2) );

            //var d1_min = ToNumber_Safe(document.getElementById('d1_min').value);
            //var d1_max = ToNumber_Safe(document.getElementById('d1_max').value);
            //var d1 = d1_min + (d1_max-d1_min)*ToNumber_Safe(document.getElementById('d1_frac').value)/100.0;
            
            var d1 = 0 + (Vec2_Mag(Vec2_Sub(p2, p1))-0)*ToNumber_Safe(data[i+1][3]) / c_Tangent_Max / 2;

            // draw biarc
            {
                var v       = Vec2_Sub(p2, p1);
                var vMagSqr = Vec2_MagSqr(v);
                
                var vDotT1 = Vec2_Dot(v,t1);
                
                // if we are using a custom value for d1
                if (data[i+1][3] != -2)
                {
                        var vDotT2 = Vec2_Dot(v,t2);
                        var t1DotT2 = Vec2_Dot(t1,t2);
                        var denominator = (vDotT2 - d1*(t1DotT2 - 1));
                        
                        if (IsEqualEps(denominator,0.0))
                        {
                                document.getElementById('d1').value = 'Infinity';
                                document.getElementById('d2').value = d2;

                                // the second arc is a semicircle
                                var joint = Vec2_AddScaled(p1, t1, d1);
                                joint = Vec2_AddScaled(joint, t2, vDotT2 - d1*t1DotT2);
                                if (data[i+1][3] == 0) {
                                  joint = p1;
                                } else if (data[i+1][3] == -1) {

                                  joint = p2;
                                }

                                // draw bounds
                                DrawLine(context, p1, Vec2_AddScaled(p1, t1, d1), boundsWidth, boundsColor);                    
                                DrawLine(context, Vec2_AddScaled(p1, t1, d1), joint, boundsWidth, boundsColor);                 

                                // draw arcs
                                DrawArcFromEdge(context, p1, t1, joint, arcWidth, arcColor1, true);
                                DrawArcFromEdge(context, p2, t2, joint, arcWidth, arcColor2, false);
                        }
                        else
                        {
                                var d2 = (0.5*vMagSqr - d1*vDotT1) / denominator;
                                
                                var invLen = 1.0 / (d1 + d2);
                                
                                var joint = Vec2_Scale( Vec2_Sub(t1,t2), d1*d2 );
                                joint = Vec2_AddScaled( joint, p2, d1 );
                                joint = Vec2_AddScaled( joint, p1, d2 );
                                joint = Vec2_Scale( joint, invLen );

                                if (data[i+1][3] == 0) {
                                  joint = p1;
                                } else if (data[i][i+1] == -1) {

                                  joint = p2;
                                }
                                
                                document.getElementById('d1').value = d1;
                                document.getElementById('d2').value = d2;
                                
                                // draw bounds
                                DrawLine(context, p1, Vec2_AddScaled(p1, t1, d1), boundsWidth, boundsColor);                    
                                DrawLine(context, Vec2_AddScaled(p1, t1, d1), joint, boundsWidth, boundsColor);                 
                                DrawLine(context, joint, Vec2_AddScaled(p2, t2, -d2), boundsWidth, boundsColor);                        
                                DrawLine(context, Vec2_AddScaled(p2, t2, -d2), p2, boundsWidth, boundsColor);                   

                                // draw arcs
                                DrawArcFromEdge(context, p1, t1, joint, arcWidth, arcColor1, true);
                                DrawArcFromEdge(context, p2, t2, joint, arcWidth, arcColor2, false);
                        }
                }
                // else set d1 equal to d2
                else
                {
                        var t       = Vec2_Add(t1,t2);
                        var tMagSqr = Vec2_MagSqr(t);
                                
                        var equalTangents = IsEqualEps(tMagSqr, 4.0);
                
                        var perpT1 = IsEqualEps(vDotT1, 0.0);
                        if (equalTangents && perpT1)
                        {
                                // we have two semicircles
                                joint = Vec2_AddScaled(p1, v, 0.5);
                                        
                                document.getElementById('d1').value = 'Infinity';
                                document.getElementById('d2').value = 'Infinity';

                                // draw arcs
                                var angle = Math.atan2(v.y,v.x);
                                var center1 = Vec2_AddScaled(p1, v, 0.25);
                                var center2 = Vec2_AddScaled(p1, v, 0.75);                                      
                                var radius = Math.sqrt(vMagSqr)*0.25;
                                var cross = v.x*t1.y - v.y*t1.x;
                                DrawArc(context, center1, radius, angle, angle+Math.PI, arcWidth, arcColor1, cross < 0);
                                DrawArc(context, center2, radius, angle, angle+Math.PI, arcWidth, arcColor2, cross > 0);
                                        
                                context.globalAlpha = 0.05;
                                DrawCircle(context, center1, radius, arcColor1);
                                DrawCircle(context, center2, radius, arcColor2);
                                context.globalAlpha = 1.0;
                        }
                        else
                        {
                                var vDotT   = Vec2_Dot(v,t);
                                
                                var perpT1 = IsEqualEps(vDotT1, 0.0);

                                if (equalTangents)
                                {
                                        d1 = vMagSqr / (4*vDotT1);
                                }
                                else
                                {
                                        var denominator = 2 - 2*Vec2_Dot(t1,t2);
                                        var discriminant = Sqr(vDotT) + denominator*vMagSqr;
                                        d1 = (Math.sqrt(discriminant) - vDotT) / denominator
                                }
                
                                var joint = Vec2_Scale( Vec2_Sub(t1,t2), d1 );
                                joint = Vec2_Add( joint, p1 );
                                joint = Vec2_Add( joint, p2 );
                                joint = Vec2_Scale( joint, 0.5 );
                        
                                document.getElementById('d1').value = d1;
                                document.getElementById('d2').value = d1;
                                
                                // draw bounds
                                DrawLine(context, p1, Vec2_AddScaled(p1, t1, d1), boundsWidth, boundsColor);                    
                                DrawLine(context, Vec2_AddScaled(p1, t1, d1), joint, boundsWidth, boundsColor);                 
                                DrawLine(context, joint, Vec2_AddScaled(p2, t2, -d1), boundsWidth, boundsColor);                        
                                DrawLine(context, Vec2_AddScaled(p2, t2, -d1), p2, boundsWidth, boundsColor);                   

                                // draw arcs
                                DrawArcFromEdge(context, p1, t1, joint, arcWidth, arcColor1, true);
                                DrawArcFromEdge(context, p2, t2, joint, arcWidth, arcColor2, false);
                        }
                }
            }

            // draw points
            DrawCircle(context, p1, c_Point_Radius, pointColor1);
            DrawCircle(context, p2, c_Point_Radius, pointColor2);
            if (i == num+1) {
              DrawCircle(context, p1, c_Tangent_Length, 'black');
            } else if (i == num) {
              DrawCircle(context, p2, c_Tangent_Length, 'black');
            }

            // draw tangents
            DrawLine(context, p1, Vec2_AddScaled(p1, t1, data[i][3]), tangentWidth, pointColor1);
            if (i == num+1 && tg === true) {
              DrawLine(context, p1, Vec2_AddScaled(p1, t1, data[i][3]), tangentWidth, 'black');
            }
            DrawLine(context, p2, Vec2_AddScaled(p2, t2, data[i+1][3]), tangentWidth, pointColor2);
            if (i == num && tg === true) {
              DrawLine(context, p2, Vec2_AddScaled(p2, t2, data[i+1][3]), tangentWidth, 'black');
            }

              }
              svg += "Z";
              
              document.getElementsByTagName('svg')[0].getElementsByTagName('path')[0].setAttribute("d", svg);
              document.getElementById('path').value = document.getElementsByTagName('svg')[0].outerHTML;
            }


function setTangents() {
    pointRelPos_old = Vec2_Sub(new Vec2(data[data.length-1][0], data[data.length-1][1]), new Vec2(data[data.length-2][0], data[data.length-2][1]));

    for (var i=0; i<data.length-1; i++) {
        document.getElementById('point1_x').value = data[i][0];
        document.getElementById('point2_x').value = data[i+1][0];
        document.getElementById('point1_y').value = data[i][1];
        document.getElementById('point2_y').value = data[i+1][1];

        document.getElementById('tangent1').value = data[i][2];
        document.getElementById('tangent2').value = data[i+1][2];

        var pointRelPos = Vec2_Sub(GetPoint2(), GetPoint1());
        
        var a = Vec2_Add(pointRelPos, pointRelPos_old);
        data[i][2] = c_Degrees_Per_Radian * Math.atan2(a.y,a.x);
        
        pointRelPos_old = pointRelPos;
    }
}

function setDistances() {
    for (var i=0; i<data.length; i++) {
        data[i][3] = -2;
    }
}

//M142 81 L143 85 L137 89 L141 92 L138 94 L136 91 L124 103 L123 106 L125 108 L125 113 L121 118 L116 117 L120 113 L119 109 L110 119 L106 116 L106 138 L101 143 L95 143 L89 140 L81 130 L83 121 L87 117 L92 117 L93 118 L88 123 L91 132 L96 126 L99 129 L99 116 L103 106 L110 100 L116 100 L119 102 L131 91 L129 87 L130 85 L133 88 L138 81 Z

//M142 81 L143 82 L142 83 L142 84 L143 85 L142 86 L140 86 L140 87 L139 88 L138 88 L137 89 L138 90 L139 90 L141 92 L139 94 L138 94 L137 93 L137 92 L136 91 L124 103 L124 104 L123 105 L123 106 L125 108 L125 113 L124 114 L124 115 L121 118 L117 118 L116 117 L117 116 L118 116 L119 115 L119 114 L120 113 L120 110 L119 109 L113 115 L113 116 L110 119 L109 119 L106 116 L106 123 L107 124 L107 135 L106 136 L106 138 L101 143 L95 143 L94 142 L93 142 L92 141 L91 141 L90 140 L89 140 L83 134 L83 133 L82 132 L82 131 L81 130 L81 126 L82 125 L82 123 L83 122 L83 121 L87 117 L92 117 L93 118 L88 123 L88 126 L90 128 L90 129 L91 130 L91 132 L92 132 L92 131 L93 130 L93 129 L96 126 L99 129 L99 116 L100 115 L100 112 L101 111 L101 110 L102 109 L102 108 L103 107 L103 106 L108 101 L109 101 L110 100 L116 100 L117 101 L118 101 L119 102 L125 96 L126 96 L131 91 L131 89 L129 87 L129 86 L130 85 L131 85 L132 86 L132 87 L133 88 L137 84 L137 82 L138 81 Z

//M137 82 L138 81 L139 81 L140 81 L141 81 L142 81 L143 82 L142 83 L142 84 L143 85 L142 86 L141 86 L140 86 L140 87 L139 88 L138 88 L137 89 L138 90 L139 90 L140 91 L141 92 L140 93 L139 94 L138 94 L137 93 L137 92 L136 91 L135 92 L134 93 L133 94 L132 95 L131 96 L130 97 L129 98 L128 99 L127 100 L126 101 L125 102 L124 103 L124 104 L123 105 L123 106 L124 107 L125 108 L125 109 L125 110 L125 111 L125 112 L125 113 L124 114 L124 115 L123 116 L122 117 L121 118 L120 118 L119 118 L118 118 L117 118 L116 117 L117 116 L118 116 L119 115 L119 114 L120 113 L120 112 L120 111 L120 110 L119 109 L118 110 L117 111 L116 112 L115 113 L114 114 L113 115 L113 116 L112 117 L111 118 L110 119 L109 119 L108 118 L107 117 L106 116 L106 117 L106 118 L106 119 L106 120 L106 121 L106 122 L106 123 L107 124 L107 125 L107 126 L107 127 L107 128 L107 129 L107 130 L107 131 L107 132 L107 133 L107 134 L107 135 L106 136 L106 137 L106 138 L105 139 L104 140 L103 141 L102 142 L101 143 L100 143 L99 143 L98 143 L97 143 L96 143 L95 143 L94 142 L93 142 L92 141 L91 141 L90 140 L89 140 L88 139 L87 138 L86 137 L85 136 L84 135 L83 134 L83 133 L82 132 L82 131 L81 130 L81 129 L81 128 L81 127 L81 126 L82 125 L82 124 L82 123 L83 122 L83 121 L84 120 L85 119 L86 118 L87 117 L88 117 L89 117 L90 117 L91 117 L92 117 L93 118 L92 119 L91 120 L90 121 L89 122 L88 123 L88 124 L88 125 L88 126 L89 127 L90 128 L90 129 L91 130 L91 131 L91 132 L92 132 L92 131 L93 130 L93 129 L94 128 L95 127 L96 126 L97 127 L98 128 L99 129 L99 128 L99 127 L99 126 L99 125 L99 124 L99 123 L99 122 L99 121 L99 120 L99 119 L99 118 L99 117 L99 116 L100 115 L100 114 L100 113 L100 112 L101 111 L101 110 L102 109 L102 108 L103 107 L103 106 L104 105 L105 104 L106 103 L107 102 L108 101 L109 101 L110 100 L111 100 L112 100 L113 100 L114 100 L115 100 L116 100 L117 101 L118 101 L119 102 L120 101 L121 100 L122 99 L123 98 L124 97 L125 96 L126 96 L127 95 L128 94 L129 93 L130 92 L131 91 L131 90 L131 89 L130 88 L129 87 L129 86 L130 85 L131 85 L132 86 L132 87 L133 88 L134 87 L135 86 L136 85 L137 84 L137 83 Z

var data = ("M142 81 L143 85 L137 89 L141 92 L138 94 L136 91 L124 103 L123 106 L125 108 L125 113 L121 118 L116 117 L120 113 L119 109 L110 119 L106 116 L106 138 L101 143 L95 143 L89 140 L81 130 L83 121 L87 117 L92 117 L93 118 L88 123 L91 132 L96 126 L99 129 L99 116 L103 106 L110 100 L116 100 L119 102 L131 91 L129 87 L130 85 L133 88 L138 81 Z").slice(1,-1).split("L");

var ma = false;
var w = 3;
var ang = 70;
var d = 0;
var avg = [];
var svg = "";

for (var i=0; i<data.length; i++) {
  data[i] = data[i].trim().split(" ");
  data[i][0] = parseInt(data[i][0])*4;
  data[i][1] = parseInt(data[i][1])*4;
}
for (var i=0; i<data.length; i++) {
  
  avg[i] = [0,0];
  for (var k=i-parseInt(w/2); k<=i+parseInt(w/2); k++) {
    if (data[k]) {
      avg[i][0] += parseInt(data[k][0]);
      avg[i][1] += parseInt(data[k][1]);
    } else if (k<0) {
      avg[i][0] += parseInt(data[data.length+k][0]);
      avg[i][1] += parseInt(data[data.length+k][1]);
    } else if (k>=data.length) {
      avg[i][0] += parseInt(data[k-data.length][0]);
      avg[i][1] += parseInt(data[k-data.length][1]);
    }
  }
  avg[i][0] /= w;
  avg[i][1] /= w;
  if (ma === true) {
    data[i][0] = avg[i][0];
    data[i][1] = avg[i][1];
  }

  if (i>0) {
    var relPos = Vec2_Sub( new Vec2(data[i][0], data[i][1]), new Vec2(data[i-1][0], data[i-1][1]) );
  } else {

    var relPos = Vec2_Sub( new Vec2(data[i][0], data[i][1]), new Vec2(data[data.length-1][0], data[data.length-1][1]) );
  }
  data[i][2] = c_Degrees_Per_Radian * Math.atan2(relPos.y, relPos.x);
  data[i][3] = -2;
}

var i=1;
while (i<data.length) {
  var dist = Math.sqrt( Math.pow(data[i][0]-avg[i][0], 2) + Math.pow(data[i][1]-avg[i][1], 2) );
  var diff = Math.abs(data[i][2] - data[i-1][2]);
  if (diff > ang && diff < 360-ang) {

    var fwd_x = Math.sign(data[i][0] - data[i-1][0])/2;
    var fwd_y = Math.sign(data[i][1] - data[i-1][1])/2;
    var c = [data[i-1][0]+fwd_x, data[i-1][1]+fwd_y, data[i-1][2]];

    data.splice(i, 0, c);
    avg.splice(i, 0, avg[i-1]);
    i++;
  }
  i++;
}
console.log(data);
//var data = [[200,200,0], [400,350,0], [450,200,0], [100,100,0], [50,150,0]];
data.push(data[0]);
//data.reverse();
var num = 0;
var tg = false;
var pointRelPos_old = new Vec2(0,0);

            InitSpline();
            RenderSpline();
