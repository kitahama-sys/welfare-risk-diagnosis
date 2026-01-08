# -*- coding: utf-8 -*-
"""
福祉事業所 経営リスク診断アプリケーション
Welfare Business Risk Diagnosis Application

Tech Stack: Streamlit + Plotly + Pandas
"""

import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np

# ページ設定
st.set_page_config(
    page_title="福祉経営リスク診断",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# カスタムCSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1E3A5F;
        text-align: center;
        margin-bottom: 1rem;
    }
    .sub-header {
        font-size: 1.2rem;
        color: #5A6C7D;
        text-align: center;
        margin-bottom: 2rem;
    }
    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1.5rem;
        border-radius: 12px;
        color: white;
        text-align: center;
    }
    .risk-high { color: #E53E3E; font-weight: bold; }
    .risk-medium { color: #DD6B20; font-weight: bold; }
    .risk-low { color: #38A169; font-weight: bold; }
    .stTabs [data-baseweb="tab-list"] {
        gap: 24px;
    }
    .stTabs [data-baseweb="tab"] {
        height: 50px;
        padding: 10px 24px;
        font-size: 1.1rem;
    }
</style>
""", unsafe_allow_html=True)

# 質問データの定義
SOFT_QUESTIONS = [
    {
        "id": "soft_1",
        "category": "人材定着",
        "question": "職員間のコミュニケーションは活発ですか？",
        "description": "日常的な会話、情報共有、相談のしやすさを評価"
    },
    {
        "id": "soft_2",
        "category": "育成",
        "question": "新人職員への教育体制は整っていますか？",
        "description": "OJT計画、マニュアル、メンター制度の有無を評価"
    },
    {
        "id": "soft_3",
        "category": "理念",
        "question": "法人の理念・ビジョンは職員に浸透していますか？",
        "description": "理念の説明機会、日常業務への反映度を評価"
    },
    {
        "id": "soft_4",
        "category": "人材定着",
        "question": "職員が「言いにくいこと」を言える環境ですか？",
        "description": "心理的安全性、1on1面談、匿名アンケートの有無を評価"
    },
    {
        "id": "soft_5",
        "category": "育成",
        "question": "管理者のマネジメント能力は十分ですか？",
        "description": "経営数字の理解、部下育成、方針の翻訳力を評価"
    }
]

HARD_QUESTIONS = [
    {
        "id": "hard_1",
        "category": "人員基準",
        "question": "人員配置基準を常に満たしていますか？",
        "description": "常勤換算の計算、基準遵守状況を評価"
    },
    {
        "id": "hard_2",
        "category": "記録",
        "question": "個別支援計画は定期的に更新されていますか？",
        "description": "6ヶ月ごとの見直し、モニタリング記録を評価"
    },
    {
        "id": "hard_3",
        "category": "記録",
        "question": "サービス提供記録は適切に作成されていますか？",
        "description": "当日記録、内容の正確性、保管状況を評価"
    },
    {
        "id": "hard_4",
        "category": "安全管理",
        "question": "虐待防止委員会は設置・運営されていますか？",
        "description": "委員会設置、定期開催、研修実施を評価"
    },
    {
        "id": "hard_5",
        "category": "安全管理",
        "question": "BCP（業務継続計画）は策定・訓練されていますか？",
        "description": "BCP策定、年1回以上の訓練実施を評価"
    }
]

# 象限の定義
QUADRANT_DEFINITIONS = {
    "ホワイト優良経営": {
        "description": "組織も法令遵守も高水準。継続的な改善で更なる成長を。",
        "color": "#38A169",
        "recommendation": "現状維持しつつ、次のステージへの投資を検討してください。"
    },
    "砂上の楼閣": {
        "description": "収益は上がっているが、人が離れるリスクあり。",
        "color": "#ECC94B",
        "recommendation": "組織マネジメントの強化が急務です。一斉退職リスクに注意。"
    },
    "万年貧乏": {
        "description": "人は良いが、稼げていない・記録不備のリスクあり。",
        "color": "#ED8936",
        "recommendation": "加算取得の最適化、記録体制の整備を優先してください。"
    },
    "崩壊寸前": {
        "description": "組織・法令の両面で危機的状況。即時介入が必要。",
        "color": "#E53E3E",
        "recommendation": "専門家への相談を強く推奨します。優先順位を付けた改善を。"
    }
}


def calculate_scores(responses: dict) -> dict:
    """回答からスコアを計算"""
    soft_scores = []
    hard_scores = []
    
    category_scores = {
        "人材定着": [],
        "育成": [],
        "理念": [],
        "人員基準": [],
        "記録": [],
        "安全管理": []
    }
    
    for q in SOFT_QUESTIONS:
        score = responses.get(q["id"], 3)
        soft_scores.append(score)
        category_scores[q["category"]].append(score)
    
    for q in HARD_QUESTIONS:
        score = responses.get(q["id"], 3)
        hard_scores.append(score)
        category_scores[q["category"]].append(score)
    
    # 各カテゴリの平均を計算
    radar_scores = {}
    for cat, scores in category_scores.items():
        radar_scores[cat] = np.mean(scores) if scores else 0
    
    # 総合スコア（100点満点に変換）
    soft_total = (np.mean(soft_scores) / 5) * 100
    hard_total = (np.mean(hard_scores) / 5) * 100
    
    return {
        "soft_score": soft_total,
        "hard_score": hard_total,
        "radar_scores": radar_scores,
        "soft_raw": soft_scores,
        "hard_raw": hard_scores
    }


def determine_quadrant(soft_score: float, hard_score: float) -> str:
    """スコアから象限を判定"""
    threshold = 60  # 60点を境界とする
    
    if soft_score >= threshold and hard_score >= threshold:
        return "ホワイト優良経営"
    elif soft_score < threshold and hard_score >= threshold:
        return "砂上の楼閣"
    elif soft_score >= threshold and hard_score < threshold:
        return "万年貧乏"
    else:
        return "崩壊寸前"


def create_quadrant_chart(soft_score: float, hard_score: float) -> go.Figure:
    """4象限リスクマトリクスを作成"""
    fig = go.Figure()
    
    # 背景の象限を描画
    # 左下: 崩壊寸前（赤）
    fig.add_shape(
        type="rect", x0=0, y0=0, x1=60, y1=60,
        fillcolor="rgba(229, 62, 62, 0.3)", line=dict(width=0)
    )
    # 右下: 砂上の楼閣（黄）
    fig.add_shape(
        type="rect", x0=60, y0=0, x1=100, y1=60,
        fillcolor="rgba(236, 201, 75, 0.3)", line=dict(width=0)
    )
    # 左上: 万年貧乏（橙）
    fig.add_shape(
        type="rect", x0=0, y0=60, x1=60, y1=100,
        fillcolor="rgba(237, 137, 54, 0.3)", line=dict(width=0)
    )
    # 右上: ホワイト優良経営（緑）
    fig.add_shape(
        type="rect", x0=60, y0=60, x1=100, y1=100,
        fillcolor="rgba(56, 161, 105, 0.3)", line=dict(width=0)
    )
    
    # 境界線
    fig.add_shape(
        type="line", x0=60, y0=0, x1=60, y1=100,
        line=dict(color="gray", width=2, dash="dash")
    )
    fig.add_shape(
        type="line", x0=0, y0=60, x1=100, y1=60,
        line=dict(color="gray", width=2, dash="dash")
    )
    
    # 象限ラベル
    annotations = [
        dict(x=30, y=30, text="崩壊寸前", font=dict(size=16, color="#E53E3E"), showarrow=False),
        dict(x=80, y=30, text="砂上の楼閣", font=dict(size=16, color="#B7791F"), showarrow=False),
        dict(x=30, y=80, text="万年貧乏", font=dict(size=16, color="#C05621"), showarrow=False),
        dict(x=80, y=80, text="ホワイト優良経営", font=dict(size=16, color="#276749"), showarrow=False),
    ]
    
    # ユーザーのスコアをプロット
    fig.add_trace(go.Scatter(
        x=[hard_score],
        y=[soft_score],
        mode='markers+text',
        marker=dict(
            symbol='star',
            size=25,
            color='#1E3A5F',
            line=dict(color='white', width=2)
        ),
        text=['貴法人'],
        textposition='top center',
        textfont=dict(size=14, color='#1E3A5F'),
        name='診断結果'
    ))
    
    fig.update_layout(
        title=dict(
            text="リスク・マトリクス判定",
            font=dict(size=20, color='#1E3A5F')
        ),
        xaxis=dict(
            title="コンプライアンス・収益健全性（Hard）",
            range=[0, 100],
            tickvals=[0, 20, 40, 60, 80, 100],
            gridcolor='lightgray'
        ),
        yaxis=dict(
            title="組織健全性（Soft）",
            range=[0, 100],
            tickvals=[0, 20, 40, 60, 80, 100],
            gridcolor='lightgray'
        ),
        annotations=annotations,
        plot_bgcolor='white',
        width=700,
        height=600,
        showlegend=False
    )
    
    return fig


def create_radar_chart(radar_scores: dict) -> go.Figure:
    """レーダーチャートを作成"""
    categories = list(radar_scores.keys())
    values = [radar_scores[cat] for cat in categories]
    
    # 閉じるために最初の値を追加
    categories_closed = categories + [categories[0]]
    values_closed = values + [values[0]]
    
    fig = go.Figure()
    
    fig.add_trace(go.Scatterpolar(
        r=values_closed,
        theta=categories_closed,
        fill='toself',
        fillcolor='rgba(30, 58, 95, 0.3)',
        line=dict(color='#1E3A5F', width=2),
        marker=dict(size=8, color='#1E3A5F'),
        name='診断結果'
    ))
    
    # 基準線（3点=60%）
    baseline = [3] * len(categories_closed)
    fig.add_trace(go.Scatterpolar(
        r=baseline,
        theta=categories_closed,
        line=dict(color='red', width=1, dash='dash'),
        name='基準ライン'
    ))
    
    fig.update_layout(
        polar=dict(
            radialaxis=dict(
                visible=True,
                range=[0, 5],
                tickvals=[1, 2, 3, 4, 5],
                ticktext=['1', '2', '3', '4', '5']
            ),
            angularaxis=dict(
                tickfont=dict(size=12)
            )
        ),
        title=dict(
            text="6軸評価レーダーチャート",
            font=dict(size=20, color='#1E3A5F')
        ),
        showlegend=True,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=-0.2,
            xanchor="center",
            x=0.5
        ),
        width=600,
        height=500
    )
    
    return fig


def main():
    # ヘッダー
    st.markdown('<h1 class="main-header">🏥 福祉事業所 経営リスク診断</h1>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header">組織マネジメント（Soft）× 法令遵守（Hard）の2軸で貴法人のリスクを可視化します</p>', unsafe_allow_html=True)
    
    # サイドバー
    with st.sidebar:
        st.header("📋 基本情報")
        
        business_type = st.selectbox(
            "事業種別",
            options=[
                "障がい者グループホーム",
                "訪問看護ステーション",
                "特別養護老人ホーム",
                "訪問介護",
                "放課後等デイサービス",
                "就労継続支援A型",
                "就労継続支援B型",
                "保育園",
                "その他"
            ],
            index=0
        )
        
        respondent = st.radio(
            "回答者",
            options=["経営者", "管理者"],
            horizontal=True
        )
        
        scale = st.selectbox(
            "事業所規模",
            options=[
                "1拠点・10名未満",
                "1拠点・10-30名",
                "2-5拠点・30-100名",
                "6拠点以上・100名以上"
            ],
            index=0
        )
        
        st.divider()
        
        st.markdown("""
        ### 📖 診断の使い方
        1. 左のフォームで基本情報を入力
        2. 「診断フォーム」タブで質問に回答
        3. 「診断レポート」タブで結果を確認
        
        **スコアの目安**
        - 5: 非常に良い
        - 4: 良い
        - 3: 普通
        - 2: やや不十分
        - 1: 不十分
        """)
    
    # メインエリア（タブ）
    tab1, tab2 = st.tabs(["📝 診断フォーム", "📊 診断レポート"])
    
    # セッションステートの初期化
    if 'responses' not in st.session_state:
        st.session_state.responses = {}
    if 'submitted' not in st.session_state:
        st.session_state.submitted = False
    
    # Tab 1: 診断フォーム
    with tab1:
        st.header("診断質問")
        st.info("各質問に1〜5のスコアで回答してください。すべての質問に回答後、「診断を実行」ボタンを押してください。")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("🧑‍🤝‍🧑 組織マネジメント（Soft）")
            st.caption("人材定着・育成・理念浸透に関する質問")
            
            for q in SOFT_QUESTIONS:
                st.markdown(f"**{q['question']}**")
                st.caption(q['description'])
                st.session_state.responses[q['id']] = st.slider(
                    label=q['id'],
                    min_value=1,
                    max_value=5,
                    value=st.session_state.responses.get(q['id'], 3),
                    key=f"slider_{q['id']}",
                    label_visibility="collapsed"
                )
                st.divider()
        
        with col2:
            st.subheader("📋 法令遵守・収益（Hard）")
            st.caption("人員基準・記録・安全管理に関する質問")
            
            for q in HARD_QUESTIONS:
                st.markdown(f"**{q['question']}**")
                st.caption(q['description'])
                st.session_state.responses[q['id']] = st.slider(
                    label=q['id'],
                    min_value=1,
                    max_value=5,
                    value=st.session_state.responses.get(q['id'], 3),
                    key=f"slider_{q['id']}",
                    label_visibility="collapsed"
                )
                st.divider()
        
        # 診断実行ボタン
        if st.button("🔍 診断を実行", type="primary", use_container_width=True):
            st.session_state.submitted = True
            st.success("診断が完了しました！「診断レポート」タブで結果をご確認ください。")
    
    # Tab 2: 診断レポート
    with tab2:
        if not st.session_state.submitted:
            st.warning("まず「診断フォーム」タブで質問に回答し、「診断を実行」ボタンを押してください。")
        else:
            # スコア計算
            scores = calculate_scores(st.session_state.responses)
            quadrant = determine_quadrant(scores['soft_score'], scores['hard_score'])
            quadrant_info = QUADRANT_DEFINITIONS[quadrant]
            
            # サマリー表示
            st.header("診断結果サマリー")
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric(
                    label="組織健全性（Soft）",
                    value=f"{scores['soft_score']:.1f}点",
                    delta="100点満点"
                )
            
            with col2:
                st.metric(
                    label="コンプラ・収益健全性（Hard）",
                    value=f"{scores['hard_score']:.1f}点",
                    delta="100点満点"
                )
            
            with col3:
                st.metric(
                    label="総合判定",
                    value=quadrant
                )
            
            # 判定結果の詳細
            st.divider()
            
            # 判定結果カード
            st.markdown(f"""
            <div style="
                background: linear-gradient(135deg, {quadrant_info['color']}20, {quadrant_info['color']}40);
                border-left: 5px solid {quadrant_info['color']};
                padding: 1.5rem;
                border-radius: 8px;
                margin: 1rem 0;
            ">
                <h3 style="color: {quadrant_info['color']}; margin: 0 0 0.5rem 0;">【{quadrant}】</h3>
                <p style="margin: 0 0 1rem 0;">{quadrant_info['description']}</p>
                <p style="margin: 0; font-weight: bold;">💡 推奨アクション: {quadrant_info['recommendation']}</p>
            </div>
            """, unsafe_allow_html=True)
            
            # グラフ表示
            st.divider()
            st.header("詳細分析")
            
            chart_col1, chart_col2 = st.columns(2)
            
            with chart_col1:
                quadrant_fig = create_quadrant_chart(scores['soft_score'], scores['hard_score'])
                st.plotly_chart(quadrant_fig, use_container_width=True)
            
            with chart_col2:
                radar_fig = create_radar_chart(scores['radar_scores'])
                st.plotly_chart(radar_fig, use_container_width=True)
            
            # カテゴリ別スコア表
            st.divider()
            st.header("カテゴリ別スコア")
            
            score_data = []
            for cat, score in scores['radar_scores'].items():
                status = "🟢 良好" if score >= 4 else ("🟡 要注意" if score >= 3 else "🔴 要改善")
                score_data.append({
                    "カテゴリ": cat,
                    "スコア": f"{score:.1f} / 5.0",
                    "ステータス": status
                })
            
            score_df = pd.DataFrame(score_data)
            st.dataframe(score_df, use_container_width=True, hide_index=True)
            
            # 改善提案
            st.divider()
            st.header("改善提案（Next Action）")
            
            # スコアが低いカテゴリを特定
            low_categories = [cat for cat, score in scores['radar_scores'].items() if score < 3]
            
            if low_categories:
                st.warning(f"以下のカテゴリで改善が必要です: {', '.join(low_categories)}")
                
                recommendations = {
                    "人材定着": "定期的な1on1面談の実施、匿名アンケートの導入を検討してください。",
                    "育成": "新人教育プログラム（OJTチェックリスト）の整備、管理者研修の実施を検討してください。",
                    "理念": "理念説明会の定期開催、日常業務への理念の落とし込みを検討してください。",
                    "人員基準": "常勤換算の計算を毎月実施し、基準を下回らないよう人員計画を立ててください。",
                    "記録": "個別支援計画の更新スケジュールを策定し、記録の即日化を徹底してください。",
                    "安全管理": "虐待防止委員会の設置、BCP訓練の実施を最優先で進めてください。"
                }
                
                for cat in low_categories:
                    st.markdown(f"**{cat}**: {recommendations.get(cat, '専門家にご相談ください。')}")
            else:
                st.success("すべてのカテゴリで基準を満たしています。継続的な改善を心がけてください。")
            
            # 診断情報
            st.divider()
            st.caption(f"""
            **診断情報**
            - 事業種別: {business_type}
            - 回答者: {respondent}
            - 事業所規模: {scale}
            - 診断日: {pd.Timestamp.now().strftime('%Y年%m月%d日')}
            """)


if __name__ == "__main__":
    main()
