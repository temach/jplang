module Main exposing (..)

import Browser exposing (Document)
import Css
import Debug exposing (log)
import Dict exposing (Dict)
import Html exposing (Attribute, Html, button, div, input, li, ol, span, text)
import Html.Attributes exposing (attribute, placeholder, style, value)
import Html.Events exposing (on, onClick, onInput)
import Html.Events.Extra exposing (targetValueIntParse)
import Http
import Json.Decode as Decode
import Json.Encode as Encode
import List.Extra exposing (getAt)
import Platform.Cmd as Cmd
import Url.Builder exposing (relative)



-- MAIN


main =
    Browser.document
        { init = init
        , subscriptions = subscriptions
        , update = update
        , view = view
        }



-- MODEL


type alias KeyCandidate =
    { word : String
    , metadata : String
    , freq : List Int
    }


type alias Frequency =
    List Int


type alias Model =
    { kanji : String
    , keyword : String
    , notes : String
    , freq : List Int
    , userMessage : Dict String String
    , history : List String
    }


init : () -> ( Model, Cmd Msg )
init _ =
    let
        model =
            { kanji = "X"
            , keyword = "loading..."
            , notes = "loading notes..."
            , freq = []
            , userMessage = Dict.empty
            , history = []
            }
    in
    -- update NextWorkElement model
    -- ( model, getWorkElements )
    ( model, Cmd.none )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none



-- UPDATE


type Msg
    = KeywordInput String
    | NotesInput String
    | KeywordSubmitClick
      -- Http responses
    | KeywordSubmitReady (Result Http.Error String)
    | KeywordCheckReady (Result Http.Error KeyCandidate)
      -- input/output?
    | NextWorkElement


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        KeywordSubmitClick ->
            if String.length model.keyword > 0 then
                ( model, submitKeyword model )

            else
                ( { model | userMessage = Dict.insert "KeywordSubmitClick" "Error: keyword length must be non-zero" model.userMessage }, Cmd.none )

        KeywordSubmitReady result ->
            case result of
                Ok body ->
                    let
                        newElement =
                            { kanji = model.kanji
                            , keyword = model.keyword
                            , notes = model.notes
                            }

                        -- newWork =
                        --     updateWorkElement model.currentWorkIndex newElement model.workElements
                        newModel =
                            model
                    in
                    if String.length body > 0 then
                        ( { model | userMessage = Dict.insert "KeywordSubmitReady" ("Error submitting keyword. Details:" ++ body) model.userMessage }, Cmd.none )

                    else
                        update NextWorkElement { newModel | userMessage = Dict.empty }

                Err _ ->
                    ( { model | userMessage = Dict.insert "KeywordSubmitReady" "Error submitting keyword. Details unknown." model.userMessage }, Cmd.none )

        NextWorkElement ->
            ( model, Cmd.none )

        KeywordInput word ->
            let
                newCandidateHistory =
                    model.history ++ [ model.keyword ]

                newModel =
                    { model
                        | keyword = word
                        , history = historyFilter newCandidateHistory
                    }
            in
            if String.length word >= 2 then
                ( newModel, getKeywordCheck newModel.kanji word )

            else
                ( { newModel | freq = [], userMessage = Dict.empty }, Cmd.none )

        NotesInput word ->
            ( { model | notes = word }, Cmd.none )

        KeywordCheckReady result ->
            case result of
                Ok elem ->
                    ( { model | freq = elem.freq, userMessage = Dict.insert "KeywordCheckReady" elem.metadata model.userMessage }, Cmd.none )

                Err _ ->
                    ( { model | freq = [], userMessage = Dict.insert "KeywordCheckReady" "Error getting keyword frequency" model.userMessage }, Cmd.none )


uniq : List a -> List a
uniq list =
    case list of
        [] ->
            []

        [ a ] ->
            [ a ]

        a :: b :: more ->
            if a == b then
                uniq (a :: more)

            else
                a :: uniq (b :: more)


historyFilter : List String -> List String
historyFilter list =
    uniq (List.filter (\x -> String.length x >= 2) list)


getKeywordCheck : String -> String -> Cmd Msg
getKeywordCheck kanji keyword =
    Http.get
        { url = relative [ "api", "keywordcheck/" ++ kanji ++ "/" ++ keyword ] []
        , expect = Http.expectJson KeywordCheckReady keyCandidateDecoder
        }


keyCandidateDecoder : Decode.Decoder KeyCandidate
keyCandidateDecoder =
    Decode.map3 KeyCandidate
        (Decode.field "word" Decode.string)
        (Decode.field "metadata" Decode.string)
        (Decode.field "freq" (Decode.list Decode.int))


submitKeyword : Model -> Cmd Msg
submitKeyword model =
    Http.post
        { url = relative [ "api", "submit" ] []
        , body = Http.jsonBody (submitKeywordEncoder model)
        , expect = Http.expectString KeywordSubmitReady
        }


submitKeywordEncoder : Model -> Encode.Value
submitKeywordEncoder model =
    Encode.object
        [ ( "kanji", Encode.string model.kanji )
        , ( "keyword", Encode.string model.keyword )
        , ( "notes", Encode.string model.notes )
        ]



-- VIEW


view : Model -> Document Msg
view model =
    Document "Kanji" [ render model ]


renderUserMessages : Model -> Html Msg
renderUserMessages model =
    div [] [ text (String.join "!" (Dict.values model.userMessage)) ]


renderSubmitBar : Model -> Html Msg
renderSubmitBar model =
    div [ style "display" "flex" ]
        [ span
            [ style "flex" "1 0 auto" ]
            [ text model.kanji ]
        , span
            [ style "flex" "10 0 70px" ]
            [ input
                [ placeholder "Keyword"
                , value model.keyword
                , onInput KeywordInput
                , style "width" "100%"
                , style "box-sizing" "border-box"
                ]
                []
            ]
        , span
            [ style "flex" "1 0 auto" ]
            [ text ("Corpus: " ++ (String.fromInt <| Maybe.withDefault 0 <| getAt 0 model.freq)) ]
        , span
            [ style "flex" "1 0 auto" ]
            [ text ("Subs: " ++ (String.fromInt <| Maybe.withDefault 0 <| getAt 1 model.freq)) ]
        , span
            [ style "flex" "1 0 auto" ]
            [ button [ onClick KeywordSubmitClick ] [ text "Submit" ] ]
        , span
            [ style "flex" "10 0 70px" ]
            [ input
                [ placeholder "Notes"
                , value model.notes
                , onInput NotesInput
                , style "width" "100%"
                , style "box-sizing" "border-box"
                ]
                []
            ]
        ]


render : Model -> Html Msg
render model =
    -- Keyword submit
    div
        [ style "background-color" "rgb(250, 250, 250)"
        , style "overflow" "auto"
        ]
        [ renderUserMessages model
        , renderSubmitBar model
        ]
